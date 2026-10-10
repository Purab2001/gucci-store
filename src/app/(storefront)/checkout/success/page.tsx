import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { OrderMeta } from "@/components/checkout/OrderMeta";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PendingOrderRefresh } from "@/components/checkout/PendingOrderRefresh";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatCents, formatDate } from "@/lib/format";
import { orderReference } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order confirmed — Gucci Store",
  description: "Your order confirmation.",
};

// Reads the session and order at request time — never prerendered.
export const instant = false;

/**
 * Read-only receipt. This page NEVER writes order state: `paid` comes only
 * from the signed webhook. While the webhook is in flight the order reads
 * `pending` and the page says so, with a refresh prompt.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  // No blank pages: unknown sessions render the 404 (avoids leaking whether
  // an order exists, consistent with the admin 404 pattern).
  if (!sessionId) notFound();

  const user = await requireUser(
    `/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
  );
  // Owner scoped in SQL (like getOrderByIdForUser): another customer's row
  // never leaves the database, and unknown sessions 404 either way.
  const order = await db.query.orders.findFirst({
    // Relational query: keep `with` inline (hoisting breaks inference).
    where: and(
      eq(orders.stripeSessionId, sessionId),
      eq(orders.userId, user.id),
    ),
    with: { items: true },
  });
  if (!order) notFound();

  // Best-effort live hint: Stripe may already report paid while the webhook
  // is still travelling. Display-only — fulfilment still waits for it.
  let stripePaid = false;
  if (order.status === "pending") {
    try {
      const session =
        await getStripe().checkout.sessions.retrieve(sessionId);
      stripePaid = session.payment_status === "paid";
    } catch {
      stripePaid = false;
    }
  }

  const totalUnits = order.items.reduce((n, i) => n + i.quantity, 0);
  const unitWord = totalUnits === 1 ? "piece" : "pieces";
  const reference = orderReference(order.id);
  const placedOn = formatDate(order.paidAt ?? order.createdAt);

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-luxe section">
        {order.status === "paid" ? (
          <>
            <p className="eyebrow text-brass">Order confirmed</p>
            <h1 className="display mt-3">Thank you — your order is in the atelier</h1>
            <p className="body-luxe mt-4 max-w-md text-sm">
              {totalUnits} {unitWord} · {formatCents(order.subtotalCents)} ·
              the atelier begins preparation at once.
            </p>
            <OrderMeta
              reference={reference}
              placedOn={placedOn}
              email={user.email}
            />
            <OrderSummary
              lines={order.items}
              subtotalCents={order.subtotalCents}
            />
          </>
        ) : order.status === "pending" ? (
          <>
            <p className="eyebrow text-brass">Confirming payment</p>
            <h1 className="display mt-3">
              {stripePaid ? "Payment received — finalizing your order" : "Confirming your payment"}
            </h1>
            <p className="body-luxe mt-4 max-w-md text-sm">
              {stripePaid
                ? "Your payment cleared and the atelier is recording your order. The receipt appears below on its own."
                : "Your payment is being confirmed. The receipt appears below on its own."}
            </p>
            <PendingOrderRefresh />
            <OrderMeta
              reference={reference}
              placedOn={placedOn}
              email={user.email}
            />
            <OrderSummary
              lines={order.items}
              subtotalCents={order.subtotalCents}
            />
          </>
        ) : (
          <>
            <p className="eyebrow text-brass">Payment incomplete</p>
            <h1 className="display mt-3">This order did not complete</h1>
            <p className="body-luxe mt-4 max-w-md text-sm">
              No charge was kept and your bag is unchanged. Return to your bag to try again.
            </p>
          </>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {order.status === "paid" ? (
            <Link href="/shop" className="btn btn-primary">
              Continue shopping
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : order.status === "pending" ? (
            <Link href="/bag" className="btn btn-secondary">
              Back to bag
            </Link>
          ) : (
            <>
              <Link href="/bag" className="btn btn-primary">
                Back to bag
              </Link>
              <Link href="/shop" className="link-nav inline-flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to shop
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
