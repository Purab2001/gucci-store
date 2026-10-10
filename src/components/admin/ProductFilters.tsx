import type { AdminCategoryOption } from "@/lib/admin-products";

interface ProductFiltersProps {
  query: string;
  category: string;
  stock: "all" | "low" | "out";
  categories: AdminCategoryOption[];
}

const inputClass =
  "h-12 w-full border border-line bg-canvas px-4 text-sm text-ink placeholder:text-stone transition-colors focus:border-ink focus:outline-none";

/**
 * Server-rendered search + category filter. Plain GET form — no client
 * JS. The active stock chip rides along as a hidden input; the chips
 * preserve `q`/`category` through their hrefs, so filters compose.
 */
export function ProductFilters({
  query,
  category,
  stock,
  categories,
}: ProductFiltersProps) {
  return (
    <form
      method="get"
      action="/admin/products"
      role="search"
      aria-label="Search and filter products"
      className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
    >
      {stock !== "all" ? (
        <input type="hidden" name="stock" value={stock} />
      ) : null}
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="admin-product-q" className="eyebrow text-smoke">
          Search
        </label>
        <input
          id="admin-product-q"
          name="q"
          type="search"
          maxLength={100}
          defaultValue={query}
          placeholder="Name or slug…"
          autoComplete="off"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-product-category" className="eyebrow text-smoke">
          Category
        </label>
        <select
          id="admin-product-category"
          name="category"
          defaultValue={category}
          className={inputClass}
        >
          <option value="">All families</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-secondary">
        Apply
      </button>
    </form>
  );
}
