import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCents, formatDate } from "@/lib/format";
import { getAdminOrders } from "@/lib/admin-orders";
import { orderReference, orderStatusState } from "@/lib/orders";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Orders — Admin",
  description: "View all orders.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminOrdersPage() {
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth). Admin order reads are
  // unscoped (all customers) — hence the double check.
  await requireAdmin("/admin/orders");
  const rows = await getAdminOrders();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="admin-orders-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Fulfilment</p>
        <h2 id="admin-orders-heading" className="heading-sub mt-3">
          Orders · {rows.length}
        </h2>
        <p className="body-luxe mt-3 max-w-md text-sm">
          Every checkout attempt lives here — reference, date, customer,
          total and payment state. Read-only: only the Stripe webhook moves
          orders out of pending.
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="surface-card px-7 py-8 sm:px-9">
          <p className="body-luxe text-sm">
            No checkout attempts yet — orders appear here once shoppers check
            out.
          </p>
        </section>
      ) : (
        <section
          aria-label="Order list"
          className="surface-card overflow-x-auto"
        >
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Order
                </th>
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Customer
                </th>
                <th
                  scope="col"
                  className="eyebrow px-5 py-4 text-right text-smoke"
                >
                  Total
                </th>
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Status
                </th>
                <th scope="col" className="sr-only">
                  Open
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((order) => {
                const state = orderStatusState(order.status);
                const units = order.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">
                        {orderReference(order.id)}
                      </p>
                      <p className="mt-0.5 text-xs text-stone">
                        {formatDate(order.paidAt ?? order.createdAt)} ·{" "}
                        {units} {units === 1 ? "piece" : "pieces"}
                      </p>
                    </td>
                    <td className="max-w-56 truncate px-5 py-4 text-smoke">
                      {order.user?.email ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-ink">
                      {formatCents(order.subtotalCents)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-xs text-stone">
                        <span
                          aria-hidden="true"
                          className={`inline-block size-1.5 rounded-full ${state.dotClass}`}
                        />
                        {state.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="link-luxe inline-flex items-center gap-1 text-xs text-ink"
                        aria-label={`Open ${orderReference(order.id)}`}
                      >
                        Open
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
