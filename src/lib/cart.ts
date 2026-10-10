import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, products } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/session";
import {
  EMPTY_BAG,
  type Bag,
  type BagActionResult,
  type BagItem,
} from "@/lib/cart-types";

/**
 * Only module that touches the db for carts — the way products.ts owns
 * the catalogue. cart_items stores no price: every amount below is read
 * live from products.price_cents, so the browser never supplies a number
 * that touches money.
 */

async function getOrCreateCartId(userId: string): Promise<string> {
  const existing = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    columns: { id: true },
  });
  if (existing) return existing.id;
  // Unique on user_id makes the double-insert race a no-op; re-read wins.
  await db.insert(carts).values({ userId }).onConflictDoNothing();
  const created = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    columns: { id: true },
  });
  if (!created) throw new Error("Could not create bag for user.");
  return created.id;
}

function toBag(
  rows: { quantity: number; product: typeof products.$inferSelect | null }[],
): Bag {
  const items: BagItem[] = [];
  for (const row of rows) {
    const p = row.product;
    if (!p) continue;
    // Same predicate as the guest preview: inactive or out-of-stock lines
    // are unavailable and excluded from count/subtotal.
    const available = p.isActive && p.stockQuantity > 0;
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.imageUrl,
      priceCents: p.priceCents,
      quantity: row.quantity,
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

export async function getBagByUserId(userId: string): Promise<Bag> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    columns: { id: true },
    // Relational query: keep `with` inline (hoisting breaks inference).
    with: { items: { with: { product: true } } },
  });
  if (!cart) return EMPTY_BAG;
  return toBag(cart.items);
}

/** Bag for the signed-in user. Redirects logged-out users to sign-in. */
export async function getBag(): Promise<Bag> {
  const user = await requireUser("/bag");
  return getBagByUserId(user.id);
}

/** Unit count for the header island. Logged-out users see 0, never a redirect. */
export async function countBagByUserId(userId: string): Promise<number> {
  return (await getBagByUserId(userId)).count;
}

export async function getBagCount(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  return countBagByUserId(user.id);
}

function asQuantity(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : (raw as number);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

export async function addItemByUserId(
  userId: string,
  productSlug: string,
  rawQuantity: unknown,
): Promise<BagActionResult> {
  const requested = asQuantity(rawQuantity);
  if (requested === null || requested < 1) {
    return { ok: false, message: "Choose a quantity of at least 1." };
  }
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.slug, productSlug),
      eq(products.isActive, true),
    ),
  });
  if (!product) {
    return { ok: false, message: "This piece is no longer available." };
  }
  if (product.stockQuantity <= 0) {
    return { ok: false, message: "This piece is out of stock." };
  }
  const cartId = await getOrCreateCartId(userId);
  const existing = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.productId, product.id),
    ),
  });
  const desired = (existing?.quantity ?? 0) + requested;
  // Stock cap: never hold more than the atelier has.
  const quantity = Math.min(desired, product.stockQuantity);
  // Upsert on the (cart_id, product_id) unique index so a concurrent
  // double-add resolves to one line instead of duplicate rows. The read
  // above can still lose an increment under exact concurrency (both read
  // the same quantity), but it can no longer create two lines.
  await db
    .insert(cartItems)
    .values({ cartId, productId: product.id, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity },
    });
  return {
    ok: true,
    clamped: quantity < desired,
    available: product.stockQuantity,
  };
}

export async function setItemQuantityByUserId(
  userId: string,
  productId: string,
  rawQuantity: unknown,
): Promise<BagActionResult> {
  const quantity = asQuantity(rawQuantity);
  if (quantity === null) {
    return { ok: false, message: "Enter a valid quantity." };
  }
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    columns: { id: true },
  });
  if (!cart) return { ok: true, clamped: false, available: null };
  const existing = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, productId),
    ),
    with: { product: true },
  });
  if (!existing) return { ok: true, clamped: false, available: null };
  const product = existing.product;
  if (!product || !product.isActive) {
    await db.delete(cartItems).where(eq(cartItems.id, existing.id));
    return { ok: false, message: "This piece is no longer available." };
  }
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, existing.id));
    return { ok: true, clamped: false, available: product.stockQuantity };
  }
  if (product.stockQuantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, existing.id));
    return { ok: false, message: "This piece just went out of stock." };
  }
  const next = Math.min(quantity, product.stockQuantity);
  await db
    .update(cartItems)
    .set({ quantity: next })
    .where(eq(cartItems.id, existing.id));
  return {
    ok: true,
    clamped: next < quantity,
    available: product.stockQuantity,
  };
}

export async function removeItemByUserId(
  userId: string,
  productId: string,
): Promise<BagActionResult> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    columns: { id: true },
  });
  if (!cart) return { ok: true, clamped: false, available: null };
  await db
    .delete(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    );
  return { ok: true, clamped: false, available: null };
}
