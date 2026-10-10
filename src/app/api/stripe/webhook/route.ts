import { NextResponse } from "next/server";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import {
  cartItems,
  carts,
  orders,
  products,
  stripeEvents,
} from "@/db/schema";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook — the ONLY writer of paid/failed/expired order state.
 * The success page never writes; the browser never supplies payment status.
 *
 * Fulfilment rule (per Stripe delayed-notification methods): act only when
 * `payment_status === "paid"`. `checkout.session.completed` can arrive while
 * still unpaid — fulfilling on it alone would ship goods for payments that
 * later fail. `async_payment_succeeded` completes those later.
 */

function sessionFrom(event: Stripe.Event): Stripe.Checkout.Session {
  return event.data.object as Stripe.Checkout.Session;
}

/** Guarded pending -> failed transition. Resolves true when this delivery won. */
async function markFailed(orderId: string): Promise<boolean> {
  const updated = await db
    .update(orders)
    .set({ status: "failed" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  return updated.length > 0;
}

/** Transition pending -> paid. Returns false if another delivery won. */
async function claimPaid(
  orderId: string,
  paymentIntentId: string | null,
): Promise<boolean> {
  const claimed = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  return claimed.length > 0;
}

async function fulfilPaidSession(sessionId: string): Promise<void> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    with: { items: true },
  });
  if (!order) {
    // Order row not yet visible (the session is created before the insert
    // lands) or the insert failed outright. Throw so this delivery 500s,
    // the ledger row is released, and Stripe redelivers into a settled
    // state instead of acking a paid order as done.
    throw new Error(
      `Stripe webhook: no order found for session ${sessionId}.`,
    );
  }
  if (order.status !== "pending") return; // Redelivery after handling.
  if (order.items.length === 0) {
    // Partial insert (header without lines) — never fulfil vacuously.
    console.error(
      `Stripe webhook: order ${order.id} has no lines; failing instead of fulfilling.`,
    );
    await markFailed(order.id);
    return;
  }

  // Server-side confirmation — the event payload alone is not trusted.
  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    // Transient Stripe/network failure with no writes yet — throw so the
    // handler 500s and Stripe redelivers.
    console.error(`Stripe webhook: retrieve failed for ${sessionId}:`, err);
    throw err;
  }
  if (session.payment_status !== "paid") return;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (session.amount_total !== order.subtotalCents) {
    // Never fulfil on a mismatch. Refund first (idempotent — a redelivery
    // after a crash replays the same refund, never a second one), then fail
    // the order for visibility instead of leaving a charged `pending`.
    // Refund errors throw: the handler 500s and Stripe redelivers while the
    // order is still `pending`.
    console.error(
      `Stripe webhook: amount mismatch for order ${order.id} ` +
        `(stripe=${session.amount_total}, order=${order.subtotalCents}).`,
    );
    if (paymentIntentId) {
      await stripe.refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `amount-mismatch-refund-${order.id}` },
      );
    } else {
      console.error(
        `Stripe webhook: order ${order.id} has an amount mismatch with no payment intent to refund.`,
      );
    }
    await markFailed(order.id);
    return;
  }

  // Final stock revalidation against the live catalogue.
  const live = await db.query.products.findMany({
    where: inArray(
      products.id,
      order.items.map((item) => item.productId),
    ),
    columns: { id: true, stockQuantity: true },
  });
  const stockById = new Map(live.map((p) => [p.id, p.stockQuantity]));
  const short = order.items.filter(
    (item) => (stockById.get(item.productId) ?? 0) < item.quantity,
  );
  if (short.length > 0) {
    // Paid but unfulfillable: refund first (idempotent, same retry logic
    // as above), then fail, so the customer is never charged for goods the
    // atelier cannot deliver.
    if (paymentIntentId) {
      await stripe.refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `shortage-refund-${order.id}` },
      );
    } else {
      console.error(
        `Stripe webhook: order ${order.id} short on stock with no payment intent to refund.`,
      );
    }
    await markFailed(order.id);
    return;
  }

  if (!(await claimPaid(order.id, paymentIntentId))) return;

  // Post-claim writes are acknowledged even on failure: returning 500 here
  // would redeliver into an already-`paid` order whose stock this block may
  // have partially decremented. A failure below pages human review instead.
  try {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, order.userId),
      columns: { id: true },
    });
    // Decrement guarded by `stock >= qty` so a concurrent fulfilment can never
    // drive stock negative; the claim above guarantees a single winner.
    // Sequential writes (not db.batch): the losers' guard makes order moot,
    // and neon-http batches aren't transactional anyway.
    for (const item of order.items) {
      await db
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
        })
        .where(
          and(
            eq(products.id, item.productId),
            gte(products.stockQuantity, item.quantity),
          ),
        );
    }
    // The bag empties only on confirmed payment — never on session creation
    // and never from the success page.
    if (cart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }
  } catch (err) {
    console.error(
      `Stripe webhook: post-payment writes failed for paid order ${order.id} — reconcile manually:`,
      err,
    );
  }
}

/** Terminal non-payment outcomes: no stock change, bag retained for retry. */
async function markTerminal(
  sessionId: string,
  status: "failed" | "expired",
): Promise<void> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    columns: { id: true, status: true },
  });
  if (!order || order.status !== "pending") return;
  await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
}

export async function POST(req: Request): Promise<NextResponse> {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  // Raw body — never req.json() first, or signature verification breaks.
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      await req.text(),
      signature,
      secret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency ledger: concurrent redeliveries of the same evt_... insert
  // once; losers acknowledge without reprocessing. The row is released if
  // handling throws (see catch below), so a failed delivery is retried
  // rather than mistaken for a duplicate.
  const fresh = await db
    .insert(stripeEvents)
    .values({ eventId: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });
  if (fresh.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = sessionFrom(event);
        if (session.payment_status === "paid") {
          await fulfilPaidSession(session.id);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        await markTerminal(sessionFrom(event).id, "failed");
        break;
      }
      case "checkout.session.expired": {
        await markTerminal(sessionFrom(event).id, "expired");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook: handler failed for ${event.id}:`, err);
    // Release the ledger row so Stripe's redelivery reprocesses instead of
    // acking as a duplicate. Best-effort: if cleanup fails, the leftover row
    // only skips one retry, which surfaces in the error log above.
    try {
      await db.delete(stripeEvents).where(eq(stripeEvents.eventId, event.id));
    } catch (cleanupErr) {
      console.error(
        `Stripe webhook: could not release ledger row for ${event.id}:`,
        cleanupErr,
      );
    }
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
