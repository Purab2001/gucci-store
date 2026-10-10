import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminCategoryOptions,
  getAdminProducts,
} from "@/lib/admin-products";
import { LOW_STOCK_THRESHOLD, stockState } from "@/lib/stock";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Overview — Admin",
  description: "Stock and catalogue summary.",
};

// Reads the session at request time — admin-only and live, so this
// route blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminPage() {
  // Layout already gates this route; re-check here so this
  // server read is itself authorized (defense in depth).
  await requireAdmin("/admin");
  const [rows, categories] = await Promise.all([
    getAdminProducts(),
    getAdminCategoryOptions(),
  ]);

  // Stats cover sellable pieces only: a retired piece can't be sold,
  // so counting it as out of stock would mislead.
  const active = rows.filter((r) => r.isActive);
  const retiredCount = rows.length - active.length;
  const inCount = active.filter(
    (r) => r.stockQuantity > LOW_STOCK_THRESHOLD,
  ).length;
  const lowRows = active.filter(
    (r) =>
      r.stockQuantity >= 1 && r.stockQuantity <= LOW_STOCK_THRESHOLD,
  );
  const outRows = active.filter((r) => r.stockQuantity <= 0);
  const attention = [...lowRows, ...outRows].sort(
    (a, b) => a.stockQuantity - b.stockQuantity,
  );

  const stats = [
    { label: "Active products", value: active.length, href: "/admin/products" },
    { label: "In stock", value: inCount, href: "/admin/products" },
    {
      label: "Low stock",
      value: lowRows.length,
      href: "/admin/products?stock=low",
    },
    {
      label: "Out of stock",
      value: outRows.length,
      href: "/admin/products?stock=out",
    },
    {
      label: "Categories",
      value: categories.length,
      href: "/admin/categories",
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="admin-overview-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Overview</p>
        <h2 id="admin-overview-heading" className="heading-sub mt-3">
          Catalogue at a glance
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-canvas px-5 py-5">
              <dt className="eyebrow text-smoke">{stat.label}</dt>
              <dd className="font-display mt-2 text-3xl">
                <Link href={stat.href} className="link-luxe">
                  {stat.value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-stone">
          Retired: {retiredCount}{" "}
          {retiredCount === 1 ? "piece" : "pieces"} — excluded from stock
          counts, still listed under{" "}
          <Link href="/admin/products" className="link-luxe">
            Products
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="admin-attention-heading"
        className="surface-card overflow-x-auto"
      >
        <div className="px-5 pt-5 sm:px-6">
          <p className="eyebrow text-brass">Restock</p>
          <h2 id="admin-attention-heading" className="heading-sub mt-2">
            Needs attention · {attention.length}
          </h2>
        </div>
        {attention.length === 0 ? (
          <p className="body-luxe px-5 py-6 text-sm sm:px-6">
            Everything is stocked — the atelier is full.
          </p>
        ) : (
          <table className="mt-4 w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Product
                </th>
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Category
                </th>
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Stock
                </th>
                <th scope="col" className="sr-only">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attention.map((row) => {
                const state = stockState(row.stockQuantity);
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{row.name}</p>
                      <p className="mt-0.5 text-xs text-stone">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {row.category.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 text-smoke">
                        <span
                          aria-hidden="true"
                          className={`inline-block size-1.5 rounded-full ${state.dotClass}`}
                        />
                        {row.stockQuantity} · {state.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${row.slug}/edit`}
                        className="link-luxe text-xs text-ink"
                        aria-label={`Edit ${row.name}`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
