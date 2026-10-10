import Link from "next/link";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getActiveProductCount,
  getCatalogProducts,
  getShopCategories,
  type SortValue,
} from "@/lib/products";

export type ShopQuery = {
  category?: string | string[];
  sort?: string | string[];
  q?: string | string[];
};

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Alphabetical" },
] as const satisfies { value: SortValue; label: string }[];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSort(value: string | undefined): SortValue {
  if (
    value === "price-asc" ||
    value === "price-desc" ||
    value === "name" ||
    value === "featured"
  ) {
    return value;
  }
  return "featured";
}

function normalizeQuery(value: string | undefined): string | null {
  const trimmed = value?.trim().slice(0, 64) ?? "";
  return trimmed ? trimmed : null;
}

function shopHref(
  categorySlug: string | null,
  sort: SortValue,
  query: string | null,
): string {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (sort !== "featured") params.set("sort", sort);
  if (query) params.set("q", query);
  const query_string = params.toString();
  return query_string ? `/shop?${query_string}` : "/shop";
}

export async function ShopListing({
  searchParams,
}: {
  searchParams: Promise<ShopQuery>;
}) {
  const query = await searchParams;
  const rawCategory = first(query.category)?.toLowerCase() ?? null;
  const activeSort = normalizeSort(first(query.sort));
  const activeQuery = normalizeQuery(first(query.q));

  const shopCategories = await getShopCategories();
  const activeCategory =
    shopCategories.find(
      (c) =>
        c.slug.toLowerCase() === rawCategory ||
        c.name.toLowerCase() === rawCategory,
    ) ?? null;

  const [filtered, total] = await Promise.all([
    getCatalogProducts({
      categorySlug: activeCategory?.slug ?? null,
      sort: activeSort,
      query: activeQuery,
    }),
    getActiveProductCount(),
  ]);

  const resultLabel = activeQuery
    ? `Search results for \u201c${activeQuery}\u201d`
    : (activeCategory?.name ?? "All products");

  const hasActiveFilters =
    activeCategory !== null || activeQuery !== null || activeSort !== "featured";
  const activeSortLabel =
    sortOptions.find((option) => option.value === activeSort)?.label ??
    "Featured";

  return (
    <>
      {/* ---------- Category filter — restrained row ---------- */}
      <nav
        aria-label="Filter by category"
        className="hairline-t hairline-b bg-canvas"
      >
        <div className="container-luxe flex gap-8 overflow-x-auto py-1">
          <Link
            href={shopHref(null, activeSort, activeQuery)}
            aria-current={!activeCategory ? "page" : undefined}
            data-active={!activeCategory}
            className={`link-nav inline-flex shrink-0 items-baseline gap-1.5 whitespace-nowrap ${!activeCategory ? "text-ink" : "text-smoke"}`}
          >
            All
            <span aria-hidden="true" className="text-[0.6875rem] text-stone">
              {total}
            </span>
            <span className="sr-only">
              , {total} {total === 1 ? "piece" : "pieces"}
            </span>
          </Link>
          {shopCategories.map((category) => {
            const isActive = activeCategory?.slug === category.slug;
            return (
              <Link
                key={category.slug}
                href={shopHref(category.slug, activeSort, activeQuery)}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive}
                className={`link-nav inline-flex shrink-0 items-baseline gap-1.5 whitespace-nowrap ${isActive ? "text-ink" : "text-smoke"}`}
              >
                {category.name}
                <span aria-hidden="true" className="text-[0.6875rem] text-stone">
                  {category.count}
                </span>
                <span className="sr-only">
                  , {category.count}{" "}
                  {category.count === 1 ? "piece" : "pieces"}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Controls — toolbar over a result-meta strip ---------- */}
      <div className="hairline-b bg-ivory">
        <div className="container-luxe grid grid-cols-1 gap-x-10 gap-y-6 py-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
          <form
            action="/shop"
            method="get"
            role="search"
            className="flex w-full flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="shop-search" className="sr-only">
              Search pieces
            </label>
            <input
              id="shop-search"
              name="q"
              type="search"
              defaultValue={activeQuery ?? ""}
              placeholder="Search leather, watches, gold…"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={64}
              className="h-12 flex-1 border border-line bg-canvas px-4 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
            />
            {activeCategory ? (
              <input
                type="hidden"
                name="category"
                value={activeCategory.slug}
              />
            ) : null}
            {activeSort !== "featured" ? (
              <input type="hidden" name="sort" value={activeSort} />
            ) : null}
            <button
              type="submit"
              className="btn btn-secondary w-full sm:w-auto"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>
          <div
            className="flex max-w-full items-center gap-x-6 overflow-x-auto py-1 lg:justify-self-end"
            role="group"
            aria-label="Sort products"
          >
            <span className="eyebrow shrink-0 text-stone">Sort</span>
            {sortOptions.map((option) => {
              const isActive = activeSort === option.value;
              return (
                <Link
                  key={option.value}
                  href={shopHref(
                    activeCategory?.slug ?? null,
                    option.value,
                    activeQuery,
                  )}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive}
                  className={`link-nav shrink-0 whitespace-nowrap ${isActive ? "text-ink" : "text-smoke"}`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
        {/* ---------- Result meta — count plus active-filter chips in one row ---------- */}
        <div className="hairline-t">
          <div className="container-luxe flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5">
            <p className="eyebrow shrink-0 text-smoke" aria-live="polite">
              Showing {filtered.length} of {total}
              {activeCategory ? ` — ${activeCategory.name}` : ""}
              {activeQuery ? ` — \u201c${activeQuery}\u201d` : ""}
            </p>
            {hasActiveFilters ? (
              <div
                role="group"
                aria-label="Active filters"
                className="flex flex-wrap items-center gap-2"
              >
                {activeCategory ? (
                  <Link
                    href={shopHref(null, activeSort, activeQuery)}
                    aria-label={`Remove category filter ${activeCategory.name}`}
                    className="inline-flex items-center gap-2 border border-line bg-canvas px-3 py-1.5 text-[0.6875rem] font-semibold tracking-eyebrow text-ink uppercase transition-colors hover:border-ink"
                  >
                    {activeCategory.name}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
                {activeQuery ? (
                  <Link
                    href={shopHref(
                      activeCategory?.slug ?? null,
                      activeSort,
                      null,
                    )}
                    aria-label={`Remove search filter ${activeQuery}`}
                    className="inline-flex max-w-full items-center gap-2 border border-line bg-canvas px-3 py-1.5 text-[0.6875rem] font-semibold tracking-eyebrow text-ink uppercase transition-colors hover:border-ink"
                  >
                    <span className="truncate normal-case">
                      &ldquo;{activeQuery}&rdquo;
                    </span>
                    <X
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                ) : null}
                {activeSort !== "featured" ? (
                  <Link
                    href={shopHref(
                      activeCategory?.slug ?? null,
                      "featured",
                      activeQuery,
                    )}
                    aria-label={`Remove sort ${activeSortLabel}`}
                    className="inline-flex items-center gap-2 border border-line bg-canvas px-3 py-1.5 text-[0.6875rem] font-semibold tracking-eyebrow text-ink uppercase transition-colors hover:border-ink"
                  >
                    {activeSortLabel}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
                <Link href="/shop" className="link-luxe ml-1 text-sm">
                  Clear all
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ---------- Product grid — imagery first ---------- */}
      <section
        aria-label={resultLabel}
        className="container-luxe py-10 sm:py-14"
      >
        {filtered.length > 0 ? (
          <div className="product-grid">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="container-narrow py-20 text-center">
            <p className="eyebrow text-brass">Nothing here</p>
            <h2 className="heading-section mt-3">
              {activeQuery
                ? `No pieces match \u201c${activeQuery}\u201d`
                : "No pieces in this view"}
            </h2>
            <p className="body-luxe mx-auto mt-4 max-w-sm text-sm">
              {activeQuery
                ? "Try another search, another family, or clear the current selection to see the full catalogue."
                : "Try another family or clear the current selection to see the full catalogue."}
            </p>
            <Link href="/shop" className="btn btn-secondary mt-8">
              Clear filters
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

export function ShopListingFallback() {
  return (
    <>
      <div className="hairline-t hairline-b" aria-hidden="true">
        <div className="container-luxe flex gap-8 overflow-x-auto py-4">
          {["All", "Handbags", "Footwear", "Watches"].map((item) => (
            <span key={item} className="eyebrow shrink-0 text-stone">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="hairline-b bg-ivory" aria-hidden="true">
        <div className="container-luxe grid grid-cols-1 gap-x-10 gap-y-6 py-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <div className="h-12 flex-1 animate-pulse border border-line bg-fog" />
            <div className="h-12 w-full animate-pulse border border-line bg-fog sm:w-32" />
          </div>
          <div className="flex max-w-full items-center gap-6 overflow-x-auto py-1 lg:justify-self-end">
            <div className="h-3 w-10 shrink-0 animate-pulse bg-linen" />
            <div className="h-3 w-24 shrink-0 animate-pulse bg-linen" />
            <div className="h-3 w-32 shrink-0 animate-pulse bg-linen" />
          </div>
        </div>
        <div className="hairline-t">
          <div className="container-luxe py-3.5">
            <p className="eyebrow text-stone">Loading pieces…</p>
          </div>
        </div>
      </div>
      <div className="container-luxe py-10 sm:py-14" aria-hidden="true">
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-canvas">
              <div className="img-frame">
                <div className="absolute inset-0 animate-pulse bg-fog" />
              </div>
              <div className="product-card-body">
                <div className="h-3 w-20 animate-pulse bg-linen" />
                <div className="h-3 w-32 animate-pulse bg-linen" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
