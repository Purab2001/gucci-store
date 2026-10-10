import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, orders, products } from "@/db/schema";

/**
 * Admin catalogue + fulfilment reads. Live and uncached on purpose: the
 * storefront queries in products.ts are `"use cache"` static, while the
 * console must always show the current rows. Callers are admin routes that
 * already ran requireAdmin().
 */

export async function getAdminOrders() {
  return db.query.orders.findMany({
    // Relational query: keep `with` inline (hoisting breaks inference).
    // Unscoped by customer — admin role required at every call site.
    orderBy: desc(orders.createdAt),
    with: {
      items: true,
      user: { columns: { id: true, name: true, email: true } },
    },
  });
}

export type AdminOrderRow = Awaited<ReturnType<typeof getAdminOrders>>[number];

export async function getAdminOrderById(orderId: string) {
  const row = await db.query.orders.findFirst({
    // Relational query: keep `with` inline (hoisting breaks inference).
    where: eq(orders.id, orderId),
    with: {
      items: true,
      user: { columns: { id: true, name: true, email: true } },
    },
  });
  return row ?? null;
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  imageUrl: string | null;
  productCount: number;
  activeProductCount: number;
}

/** Every category with live piece counts (total + active). */
export async function getAdminCategoriesWithCounts(): Promise<
  AdminCategoryRow[]
> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      blurb: categories.blurb,
      imageUrl: categories.imageUrl,
      productCount: sql<number>`count(${products.id})`,
      activeProductCount: sql<number>`count(*) filter (where ${products.isActive})`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(
      categories.id,
      categories.name,
      categories.slug,
      categories.blurb,
      categories.imageUrl,
    )
    .orderBy(sql`${categories.name} asc`);
  return rows.map((row) => ({
    ...row,
    productCount: Number(row.productCount),
    activeProductCount: Number(row.activeProductCount),
  }));
}
