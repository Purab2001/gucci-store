import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCents, formatDate } from "@/lib/format";
import { getOrdersByUserId, orderReference, orderStatusState } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order history — Gucci Store",
  description: "Your past orders.",
};

// Reads the session at request time — per-customer and live, so this
// route blocks on the server instead of prerendering.
export const instant = false;

export default async function AccountOrdersPage() {
  // Layout already gates this route; re-read here so the history renders
  // from a server-authorized session scoped to this customer (defense in
  // depth — the query only ever reads this user's rows).
  const user = await requireUser("/account/orders");
  const history = await getOrdersByUserId(user.id);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="account-orders-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Orders</p>
        <h2 id="account-orders-heading" className="heading-sub mt-3">
          Order history
        </h2>
        {history.length === 0 ? (
          <>
            <p className="body-luxe mt-3 max-w-md text-sm">
              No orders yet — your confirmed pieces will appear here.
            </p>
            <Link href="/shop" className="btn btn-primary mt-6">
              Start shopping
            </Link>
          </>
        ) : (
          <ul aria-label="Orders" className="mt-6 divide-y divide-line border-y border-line">
            {history.map((order) => {
              const state = orderStatusState(order.status);
              const units = order.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="group flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink group-hover:underline">
                        {orderReference(order.id)}
                      </p>
                      <p className="mt-1 text-xs text-smoke">
                        {formatDate(order.paidAt ?? order.createdAt)} ·{" "}
                        {units} {units === 1 ? "piece" : "pieces"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <p className="flex items-center gap-2 text-xs text-stone">
                        <span
                          aria-hidden="true"
                          className={`inline-block size-1.5 rounded-full ${state.dotClass}`}
                        />
                        {state.label}
                      </p>
                      <p className="text-sm font-medium text-ink">
                        {formatCents(order.subtotalCents)}
                      </p>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 text-smoke transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
