import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

/**
 * Admin catalogue reads. Live and uncached on purpose: the storefront
 * queries in products.ts are `"use cache"` static, while the console
 * must always show the current row (including inactive products).
 * Callers are admin routes/actions that already ran requireAdmin().
 */

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export async function getAdminCategoryOptions(): Promise<
  AdminCategoryOption[]
> {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.name));
  return rows;
}

export async function getAdminProducts() {
  const rows = await db.query.products.findMany({
    // Relational query: keep `with` inline (hoisting breaks inference).
    with: { category: true },
    orderBy: desc(products.createdAt),
  });
  return rows;
}

export type AdminProductRow = Awaited<
  ReturnType<typeof getAdminProducts>
>[number];

export async function getAdminProductBySlug(slug: string) {
  const row = await db.query.products.findFirst({
    // Relational query: keep `with` inline (hoisting breaks inference).
    // No isActive filter: admins edit retired pieces too.
    where: eq(products.slug, slug),
    with: { category: true },
  });
  return row ?? null;
}
