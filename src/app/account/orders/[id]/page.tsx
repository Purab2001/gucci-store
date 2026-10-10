import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { OrderMeta } from "@/components/checkout/OrderMeta";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PendingOrderRefresh } from "@/components/checkout/PendingOrderRefresh";
import { formatDate } from "@/lib/format";
import {
  getOrderByIdForUser,
  orderReference,
  orderStatusState,
} from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order details — Gucci Store",
  description: "Details of one of your orders.",
};

/**
 * Read-only order detail for the owning customer. Renders from the
 * snapshotted order_items — never re-read from the catalogue — reusing the
 * same receipt components as the checkout confirmation.
 */
export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  // Unknown ids and other customers' orders both render the 404, so the
  // page never leaks whether an order exists.
  const order = await getOrderByIdForUser(id, user.id);
  if (!order) notFound();

  const state = orderStatusState(order.status);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Link
        href="/account/orders"
        className="link-nav inline-flex w-fit items-center gap-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to order history
      </Link>

      <section
        aria-labelledby="account-order-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Order {orderReference(order.id)}</p>
        <h2 id="account-order-heading" className="heading-sub mt-3">
          Order details
        </h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-stone">
          <span
            aria-hidden="true"
            className={`inline-block size-1.5 rounded-full ${state.dotClass}`}
          />
          {state.label} · {state.note}
        </p>
        {order.status === "pending" && <PendingOrderRefresh />}
        <OrderMeta
          reference={orderReference(order.id)}
          placedOn={formatDate(order.paidAt ?? order.createdAt)}
          email={user.email}
        />
        <OrderSummary
          lines={order.items}
          subtotalCents={order.subtotalCents}
        />
      </section>
    </div>
  );
}
