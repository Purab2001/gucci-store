"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import {
  addItemByUserId,
  countBagByUserId,
  getBagByUserId,
  removeItemByUserId,
  setItemQuantityByUserId,
} from "@/lib/cart";
import type { Bag, BagActionResult } from "@/lib/cart-types";
import { getSessionUser, requireUser } from "@/lib/session";

/**
 * Thin auth + revalidation wrappers over the bag data layer. Client
 * components import actions from here — never from cart.ts (server-only)
 * and never with a user id: the user always comes from the session.
 */

export async function getBagAction(): Promise<Bag> {
  const user = await requireUser("/bag");
  return getBagByUserId(user.id);
}

export async function getBagCountAction(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  return countBagByUserId(user.id);
}

export async function addToBagAction(
  productSlug: string,
  quantity: number,
  callbackURL = "/bag",
): Promise<BagActionResult> {
  const user = await requireUser(callbackURL);
  const result = await addItemByUserId(user.id, productSlug, quantity);
  // Refreshes every RSC that read the bag (the /bag page). The header
  // count is a client island: mutation components dispatch a
  // "bag:changed" window event (see BagCount) after a successful call.
  if (result.ok) revalidatePath("/bag");
  return result;
}

export async function updateBagQuantityAction(
  productId: string,
  quantity: number,
): Promise<BagActionResult> {
  const user = await requireUser("/bag");
  const result = await setItemQuantityByUserId(user.id, productId, quantity);
  revalidatePath("/bag");
  return result;
}

export async function removeFromBagAction(
  productId: string,
): Promise<BagActionResult> {
  const user = await requireUser("/bag");
  const result = await removeItemByUserId(user.id, productId);
  revalidatePath("/bag");
  return result;
}

/** One guest line as sent by the browser: identity + amount only. */
export interface GuestBagEntry {
  slug: string;
  quantity: number;
}

const MAX_GUEST_LINES = 100;
const MAX_GUEST_QUANTITY = 99;

function asGuestEntries(raw: unknown): GuestBagEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: GuestBagEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(0, MAX_GUEST_LINES)) {
    if (typeof item !== "object" || item === null) continue;
    const { slug, quantity } = item as { slug?: unknown; quantity?: unknown };
    if (typeof slug !== "string" || slug.length < 1 || slug.length > 128) {
      continue;
    }
    const n = typeof quantity === "number" ? Math.floor(quantity) : NaN;
    if (!Number.isFinite(n) || n < 1) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    entries.push({ slug, quantity: Math.min(n, MAX_GUEST_QUANTITY) });
  }
  return entries;
}

/**
 * Resolves a guest bag (slugs + quantities from localStorage) against the
 * live catalogue. The browser never supplies a price: every cent below is
 * read from products.price_cents, quantities are capped at live stock, and
 * missing/inactive/out-of-stock rows resolve to unavailable lines — the same
 * shape getBagByUserId returns for signed-in shoppers.
 */
export async function getGuestBagPreviewAction(raw: unknown): Promise<Bag> {
  const entries = asGuestEntries(raw);
  if (entries.length === 0) return { items: [], count: 0, subtotalCents: 0 };
  const rows = await db.query.products.findMany({
    where: inArray(
      products.slug,
      entries.map((e) => e.slug),
    ),
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const items: Bag["items"] = [];
  for (const entry of entries) {
    const p = bySlug.get(entry.slug);
    if (!p) continue;
    const available = p.isActive && p.stockQuantity > 0;
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.imageUrl,
      priceCents: p.priceCents,
      quantity: available
        ? Math.min(entry.quantity, p.stockQuantity)
        : entry.quantity,
      stockQuantity: p.stockQuantity,
      available,
    });
  }
  const subtotalCents = items.reduce(
    (sum, item) =>
      item.available ? sum + item.priceCents * item.quantity : sum,
    0,
  );
  const count = items.reduce(
    (sum, item) => (item.available ? sum + item.quantity : sum),
    0,
  );
  return { items, count, subtotalCents };
}
