// Bag shapes. Client-importable: no server-only import here, so client
// components can use these types without pulling db/auth into the bundle.

export interface BagItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  /** Unit price in whole cents, read live from products.price_cents. */
  priceCents: number;
  quantity: number;
  /** Live catalogue stock for this product. */
  stockQuantity: number;
  /** False when the product was deactivated or went out of stock since it was added. */
  available: boolean;
}

export interface Bag {
  items: BagItem[];
  /** Total units across lines. */
  count: number;
  /** Subtotal in whole cents (sums live price_cents x quantity). */
  subtotalCents: number;
}

export const EMPTY_BAG: Bag = { items: [], count: 0, subtotalCents: 0 };

/** Outcome of a mutating bag action, for inline UI messaging. */
export type BagActionResult =
  | { ok: true; clamped: boolean; available: number | null }
  | { ok: false; message: string };
