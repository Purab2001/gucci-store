import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityForm } from "@/components/admin/AvailabilityForm";
import { ProductFilters } from "@/components/admin/ProductFilters";
import { StockForm } from "@/components/admin/StockForm";
import { formatCents } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";
import {
  setProductAvailabilityAction,
  updateStockAction,
} from "@/lib/admin-actions";
import {
  getAdminCategoryOptions,
  getAdminProducts,
} from "@/lib/admin-products";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Products — Admin",
  description: "View and manage catalogue products.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

type StockFilter = "all" | "low" | "out";

function firstParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").trim();
}

function normalizeStockFilter(
  value: string | string[] | undefined,
): StockFilter {
  const first = firstParam(value);
  if (first === "low" || first === "out") return first;
  return "all";
}

/** Text search covers name + slug only — predictable for v1. */
function normalizeQuery(value: string | string[] | undefined): string {
  return firstParam(value).slice(0, 100);
}

/** Builds chip hrefs that preserve the other active filters. */
function productsHref({
  stock,
  q,
  category,
}: {
  stock?: StockFilter;
  q?: string;
  category?: string;
}): string {
  const sp = new URLSearchParams();
  if (stock && stock !== "all") sp.set("stock", stock);
  if (q) sp.set("q", q);
  if (category) sp.set("category", category);
  const qs = sp.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    stock?: string | string[];
    q?: string | string[];
    category?: string | string[];
  }>;
}) {
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth).
  await requireAdmin("/admin/products");
  const params = await searchParams;
  const filter = normalizeStockFilter(params.stock);
  const query = normalizeQuery(params.q);
  const [rows, categoryOptions] = await Promise.all([
    getAdminProducts(),
    getAdminCategoryOptions(),
  ]);
  // Unknown slugs are ignored (show all) rather than 404ing the table.
  const categorySlugs = new Set(categoryOptions.map((c) => c.slug));
  const categoryParam = firstParam(params.category);
  const category = categorySlugs.has(categoryParam) ? categoryParam : "";
  const categoryName =
    categoryOptions.find((c) => c.slug === category)?.name ?? "";

  const inScope = rows.filter((r) => {
    if (category && r.category.slug !== category) return false;
    if (query) {
      const haystack = `${r.name} ${r.slug}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  // Chip counts reflect the current search + category scope so the
  // three states always add up to the listed rows.
  const outCount = inScope.filter((r) => r.stockQuantity <= 0).length;
  const lowCount = inScope.filter(
    (r) => r.stockQuantity >= 1 && r.stockQuantity <= LOW_STOCK_THRESHOLD,
  ).length;
  const visible =
    filter === "out"
      ? inScope.filter((r) => r.stockQuantity <= 0)
      : filter === "low"
        ? inScope.filter(
            (r) =>
              r.stockQuantity >= 1 && r.stockQuantity <= LOW_STOCK_THRESHOLD,
          )
        : inScope;

  const chips: { value: StockFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: rows.length },
    { value: "low", label: "Low stock", count: lowCount },
    { value: "out", label: "Out of stock", count: outCount },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="admin-products-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-brass">Catalogue</p>
            <h2 id="admin-products-heading" className="heading-sub mt-3">
              Products · {rows.length}
            </h2>
            <p className="body-luxe mt-3 max-w-md text-sm">
              Every piece including retired ones. Price shows exact cents;
              stock state derives from quantity — edit it inline per row.
            </p>
          </div>
          <Link href="/admin/products/new" className="btn btn-primary">
            New product
          </Link>
        </div>
        <nav
          aria-label="Filter by stock"
          className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-line pt-4"
        >
          {chips.map((chip) => {
            const isActive = filter === chip.value;
            const href = productsHref({
              stock: chip.value,
              q: query || undefined,
              category: category || undefined,
            });
            return (
              <Link
                key={chip.value}
                href={href}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive || undefined}
                className={`link-nav inline-flex shrink-0 items-baseline gap-1.5 ${isActive ? "text-ink" : "text-smoke"}`}
              >
                {chip.label}
                <span aria-hidden="true" className="text-[0.6875rem] text-stone">
                  {chip.count}
                </span>
                <span className="sr-only">
                  , {chip.count} {chip.count === 1 ? "piece" : "pieces"}
                </span>
              </Link>
            );
          })}
        </nav>
        <ProductFilters
          query={query}
          category={category}
          stock={filter}
          categories={categoryOptions}
        />
      </section>

      {rows.length === 0 ? (
        <section className="surface-card px-7 py-8 sm:px-9">
          <p className="body-luxe text-sm">
            No products yet — create the first piece.
          </p>
          <Link href="/admin/products/new" className="btn btn-secondary mt-6">
            New product
          </Link>
        </section>
      ) : visible.length === 0 ? (
        <section className="surface-card px-7 py-8 sm:px-9">
          <p className="eyebrow text-brass">Nothing here</p>
          <h3 className="heading-sub mt-3">No pieces match these filters</h3>
          <p className="body-luxe mt-3 max-w-md text-sm">
            Try widening the search or clearing a filter.
          </p>
          <Link href="/admin/products" className="btn btn-secondary mt-6">
            Clear filters
          </Link>
        </section>
      ) : (
        <section
          aria-label="Product list"
          className="surface-card overflow-x-auto"
        >
          <p className="eyebrow px-5 pt-4 text-smoke" aria-live="polite">
            Showing {visible.length} of {rows.length}
            {filter !== "all"
              ? ` — ${filter === "out" ? "out of stock" : "low stock"}`
              : ""}
            {categoryName ? ` — ${categoryName}` : ""}
            {query ? ` — “${query}”` : ""}{" "}
            <Link href="/admin/products" className="link-luxe">
              Clear filters
            </Link>
          </p>
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Product
                </th>
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Category
                </th>
                <th
                  scope="col"
                  className="eyebrow px-4 py-3 text-right text-smoke"
                >
                  Price
                </th>
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Stock
                </th>
                <th scope="col" className="eyebrow px-4 py-3 text-smoke">
                  Status
                </th>
                <th scope="col" className="sr-only">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => {
                const toggle = setProductAvailabilityAction.bind(
                  null,
                  row.id,
                );
                const saveStock = updateStockAction.bind(null, row.id);
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{row.name}</p>
                      <p className="mt-0.5 text-xs text-stone">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {row.category.name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {formatCents(row.priceCents)}
                    </td>
                    <td className="px-4 py-3">
                      <StockForm
                        productId={row.id}
                        productName={row.name}
                        stockQuantity={row.stockQuantity}
                        formAction={saveStock}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <AvailabilityForm
                        productName={row.name}
                        isActive={row.isActive}
                        formAction={toggle}
                      />
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
        </section>
      )}
    </div>
  );
}
