import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { OrderMeta } from "@/components/checkout/OrderMeta";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { getAdminOrderById } from "@/lib/admin-orders";
import { formatDate } from "@/lib/format";
import { orderReference, orderStatusState } from "@/lib/orders";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order details — Admin",
  description: "View one order.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth). Unscoped by customer —
  // admin role required.
  await requireAdmin(`/admin/orders/${id}`);
  // Unknown ids 404 the same way for every admin.
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const state = orderStatusState(order.status);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Link
        href="/admin/orders"
        className="link-nav inline-flex w-fit items-center gap-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to orders
      </Link>
      <section
        aria-labelledby="admin-order-detail-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">
          Fulfilment · {orderReference(order.id)}
        </p>
        <h2 id="admin-order-detail-heading" className="heading-sub mt-3">
          Order details
        </h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-stone">
          <span
            aria-hidden="true"
            className={`inline-block size-1.5 rounded-full ${state.dotClass}`}
          />
          {state.label} · {state.note}
        </p>
        <OrderMeta
          reference={orderReference(order.id)}
          placedOn={formatDate(order.paidAt ?? order.createdAt)}
          email={order.user?.email ?? "Unknown customer"}
        />
        <dl className="mt-8 max-w-xl divide-y divide-line border-y border-line">
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Stripe session</dt>
            <dd className="text-right font-mono text-xs break-all text-ink">
              {order.stripeSessionId}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Payment intent</dt>
            <dd className="text-right font-mono text-xs break-all text-ink">
              {order.stripePaymentIntentId ?? "—"}
            </dd>
          </div>
        </dl>
        <OrderSummary
          lines={order.items}
          subtotalCents={order.subtotalCents}
        />
        <p className="mt-6 max-w-xl text-xs leading-relaxed text-stone">
          Snapshot lines render from order_items — catalogue edits never
          rewrite this receipt. Status is owned by the Stripe webhook;
          there is no manual fulfilment control in v1.
        </p>
      </section>
    </div>
  );
}
