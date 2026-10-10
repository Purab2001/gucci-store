import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Collection, Product } from "@/types";

export type SortValue = "featured" | "price-asc" | "price-desc" | "name";

/** Only place that divides cents by 100. Components receive dollars. */
export function mapProduct(
  row: typeof products.$inferSelect,
  categoryName: string,
  categorySlug: string,
): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.priceCents / 100,
    image: row.imageUrl,
    category: categoryName,
    categorySlug,
    tag: row.tag,
    stockQuantity: row.stockQuantity,
    description: row.description,
    material: row.material,
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db.query.products.findMany({
    where: and(eq(products.isFeatured, true), eq(products.isActive, true)),
    with: { category: true },
    orderBy: desc(products.createdAt),
  });
  return rows.map((r) =>
    mapProduct(r, r.category.name, r.category.slug),
  );
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db.query.products.findMany({
    where: eq(products.isActive, true),
    with: { category: true },
    orderBy: desc(products.createdAt),
    limit,
  });
  return rows.map((r) =>
    mapProduct(r, r.category.name, r.category.slug),
  );
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db
    .select()
    .from(categories)
    .where(isNotNull(categories.imageUrl))
    .orderBy(asc(categories.name));
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    blurb: c.blurb ?? "",
    image: c.imageUrl ?? "",
  }));
}

export async function getShopCategories(): Promise<
  { name: string; slug: string; count: number }[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(
        eq(products.categoryId, categories.id),
        eq(products.isActive, true),
      ),
    )
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(asc(categories.name));
  return rows.map((row) => ({ ...row, count: Number(row.count) }));
}

export async function getCollectionBySlug(
  slug: string,
): Promise<Collection | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue", `collection-${slug}`);
  const row = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    blurb: row.blurb ?? "",
    image: row.imageUrl ?? "",
  };
}

export async function getAllCollectionSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.slug));
  return rows.map((r) => r.slug);
}

/** Total active count for the "Showing X of Y" line. */
export async function getActiveProductCount(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));
  return Number(rows[0]?.count ?? 0);
}

export async function getCatalogProducts(opts?: {
  categorySlug?: string | null;
  sort?: SortValue;
  query?: string | null;
}): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const { categorySlug = null, sort = "featured", query = null } = opts ?? {};

  const orderBy =
    sort === "price-asc"
      ? asc(products.priceCents)
      : sort === "price-desc"
        ? desc(products.priceCents)
        : sort === "name"
          ? asc(products.name)
          : desc(products.createdAt);

  // Relational query: write `with` inline at the call site
  // (hoisting it into a shared const breaks result-shape inference).
  // Category + search filtering happens in SQL, not in JS.
  const conditions = [eq(products.isActive, true)];

  if (categorySlug) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
      columns: { id: true },
    });
    if (!cat) return [];
    conditions.push(eq(products.categoryId, cat.id));
  }

  for (const term of searchTerms(query)) {
    const pattern = `%${term}%`;
    const categoryMatch = db
      .select({ id: categories.id })
      .from(categories)
      .where(ilike(categories.name, pattern));
    const termFilter = or(
      ilike(products.name, pattern),
      ilike(products.description, pattern),
      ilike(products.material, pattern),
      ilike(products.tag, pattern),
      inArray(products.categoryId, categoryMatch),
    );
    if (termFilter) conditions.push(termFilter);
  }

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    with: { category: true },
    orderBy,
  });
  return rows.map((r) => mapProduct(r, r.category.name, r.category.slug));
}

/**
 * Split a raw search-box value into capped, LIKE-safe terms.
 * Every term must match somewhere (AND); within a term any
 * column may match (OR). Wildcards are escaped so `100%`
 * searches for a literal percent, not everything.
 */
function searchTerms(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .trim()
    .slice(0, 64)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((term) =>
      term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_"),
    );
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue", `product-${slug}`);
  const row = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: { category: true },
  });
  if (!row) return undefined;
  return mapProduct(row, row.category.name, row.category.slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.isActive, true));
  return rows.map((r) => r.slug);
}

export async function getRelatedProducts(
  product: Product,
  count = 4,
): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue", `product-${product.slug}`);
  // Bounded: same-category first, then fill from the rest. Never pulls the
  // whole catalogue into JS.
  const cat = await db.query.categories.findFirst({
    where: eq(categories.slug, product.categorySlug),
    columns: { id: true },
  });
  const sameCategoryRows =
    cat
      ? await db.query.products.findMany({
          where: and(
            eq(products.isActive, true),
            eq(products.categoryId, cat.id),
            ne(products.id, product.id),
          ),
          with: { category: true },
          orderBy: desc(products.createdAt),
          limit: count,
        })
      : [];
  const mappedSame = sameCategoryRows.map((r) =>
    mapProduct(r, r.category.name, r.category.slug),
  );
  if (mappedSame.length >= count) return mappedSame.slice(0, count);
  const excludeIds = [product.id, ...mappedSame.map((p) => p.id)];
  const fillRows = await db.query.products.findMany({
    where: and(
      eq(products.isActive, true),
      ...excludeIds.map((id) => ne(products.id, id)),
    ),
    with: { category: true },
    orderBy: desc(products.createdAt),
    limit: count - mappedSame.length,
  });
  const mappedFill = fillRows.map((r) =>
    mapProduct(r, r.category.name, r.category.slug),
  );
  return [...mappedSame, ...mappedFill].slice(0, count);
}
