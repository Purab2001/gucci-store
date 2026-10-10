"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getBagByUserId } from "@/lib/cart";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export type CheckoutSessionResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

// Stripe-hosted sessions expire so abandoned attempts never linger.
// One hour: comfortably above Stripe's 30-minute minimum, so clock skew or
// API latency can't push session creation under it.
const SESSION_TTL_SECONDS = 60 * 60;

// Dashboard tracking label for this checkout flow (Stripe's
// `integration_identifier`, valid on API 2026-03-25.dahlia+ — the bundled
// SDK defaults to 2026-09-30.endive). Fixed value: a per-session random
// suffix would explode Dashboard cardinality. The 8-letter suffix only
// de-collides this flow from other integrations.
const INTEGRATION_IDENTIFIER = "gucci-store-checkout-GeUrIOsp";

function appOrigin(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is missing. Copy .env.example to .env and set the app origin.",
    );
  }
  return url.replace(/\/$/, "");
}

/**
 * Starts Stripe checkout for the signed-in bag. Amounts are rebuilt from a
 * fresh server-side bag read — the browser supplies no price, total, or
 * line item. Stock is revalidated here (add-to-bag caps and the webhook
 * recheck are the other two gates). Prior `pending` attempts are superseded
 * first (their sessions are verified + expired), so two sessions can never
 * both be payable. Creates the Stripe session, then writes a `pending` order
 * + snapshotted items; only the signed webhook may later mark it `paid`.
 */
export async function createCheckoutSessionAction(): Promise<CheckoutSessionResult> {
  const user = await requireUser("/bag");
  const bag = await getBagByUserId(user.id);

  if (bag.items.length === 0) {
    return { ok: false, message: "Your bag is empty." };
  }
  const unavailable = bag.items.filter((item) => !item.available);
  if (unavailable.length > 0) {
    const names = unavailable
      .slice(0, 3)
      .map((item) => item.name)
      .join(", ");
    return {
      ok: false,
      message: `No longer available: ${names}. Remove ${unavailable.length === 1 ? "it" : "them"} from your bag and try again.`,
    };
  }
  const overStock = bag.items.filter(
    (item) => item.quantity > item.stockQuantity,
  );
  if (overStock.length > 0) {
    return {
      ok: false,
      message:
        "Some quantities exceed what the atelier holds. Update quantities and try again.",
    };
  }

  const subtotalCents = bag.items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  if (subtotalCents <= 0) {
    return { ok: false, message: "Your bag total is invalid." };
  }

  // One live checkout per customer: supersede prior `pending` attempts so a
  // cross-tab double submit or an abandon-and-retry can never leave two
  // payable sessions (the button's disabled state only covers one tab).
  // Paid sessions are never touched — their webhook owns fulfilment.
  const priorPendings = await db.query.orders.findMany({
    where: and(eq(orders.userId, user.id), eq(orders.status, "pending")),
    columns: { id: true, stripeSessionId: true },
  });
  for (const prior of priorPendings) {
    let priorSession;
    try {
      priorSession =
        await getStripe().checkout.sessions.retrieve(prior.stripeSessionId);
    } catch (err) {
      // Fail closed: without a live read we can't prove the old session is
      // unpaid, so don't risk creating a second payable one.
      console.error("Prior checkout verification failed:", err);
      return {
        ok: false,
        message: "Couldn't verify your previous checkout. Please try again.",
      };
    }
    if (priorSession.payment_status === "paid" || priorSession.status === "complete") {
      // Money moved or the session completed (async methods can complete
      // while still unpaid) — the webhook owns the outcome. A second session
      // here would risk a double charge.
      return {
        ok: false,
        message:
          "A payment for your bag is already being confirmed. Your receipt will appear under Account → Orders.",
      };
    }
    if (priorSession.status === "open") {
      try {
        await getStripe().checkout.sessions.expire(prior.stripeSessionId);
      } catch {
        // Lost a race (paid/completed/expired concurrently) — re-read before
        // touching the row, or a just-paid order would be canceled out from
        // under its webhook.
        let reread;
        try {
          reread =
            await getStripe().checkout.sessions.retrieve(prior.stripeSessionId);
        } catch (rereadErr) {
          console.error("Prior checkout re-verification failed:", rereadErr);
          return {
            ok: false,
            message:
              "Couldn't verify your previous checkout. Please try again.",
          };
        }
        if (reread.payment_status === "paid" || reread.status === "complete") {
          return {
            ok: false,
            message:
              "A payment for your bag is already being confirmed. Your receipt will appear under Account → Orders.",
          };
        }
        // Otherwise it expired concurrently — fall through and close the row.
      }
    }
    await db
      .update(orders)
      .set({ status: "canceled" })
      .where(and(eq(orders.id, prior.id), eq(orders.status, "pending")));
  }

  // Dynamic payment methods: no `payment_method_types`, so Stripe shows the
  // most relevant methods per customer with zero code changes.
  let session: { id: string; url: string | null };
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      integration_identifier: INTEGRATION_IDENTIFIER,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      line_items: bag.items.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.priceCents,
          product_data: {
            name: item.name,
            images: [item.image],
            metadata: { productId: item.productId, slug: item.slug },
          },
        },
        quantity: item.quantity,
      })),
      success_url: `${appOrigin()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin()}/checkout/cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return {
      ok: false,
      message: "Couldn't reach the payment service. Please try again.",
    };
  }
  if (!session.url) {
    return { ok: false, message: "Couldn't start checkout. Please try again." };
  }

  // Stripe session first, order rows second: if the inserts fail we return an
  // error and never redirect, so the orphan session simply expires unpaid —
  // it can never be paid without its URL, and the webhook only fulfils rows
  // it can find. Sequential inserts with compensation: neon-http batches are
  // not transactional, so a failed lines insert removes the orphan header
  // instead of leaving a lineless `pending` order behind.
  const orderId = crypto.randomUUID();
  try {
    await db.insert(orders).values({
      id: orderId,
      userId: user.id,
      status: "pending",
      subtotalCents,
      currency: "usd",
      stripeSessionId: session.id,
    });
  } catch (err) {
    console.error("Pending order insert failed:", err);
    return {
      ok: false,
      message: "Couldn't start checkout. Please try again.",
    };
  }
  try {
    await db.insert(orderItems).values(
      bag.items.map((item) => ({
        orderId,
        productId: item.productId,
        productSlug: item.slug,
        productName: item.name,
        productImageUrl: item.image,
        unitPriceCents: item.priceCents,
        quantity: item.quantity,
      })),
    );
  } catch (err) {
    console.error("Pending order lines insert failed:", err);
    try {
      await db.delete(orders).where(eq(orders.id, orderId));
    } catch (cleanupErr) {
      console.error(
        `Could not remove orphan pending order ${orderId}:`,
        cleanupErr,
      );
    }
    return {
      ok: false,
      message: "Couldn't start checkout. Please try again.",
    };
  }

  return { ok: true, url: session.url };
}
