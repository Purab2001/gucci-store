import type { GuestBagEntry } from "@/lib/cart-actions";

/**
 * Single source of truth for guest-bag entry sanitization.
 * localStorage holds slug + quantity pairs only (never prices); live
 * money/stock always resolves server-side against products.price_cents.
 */
export const MAX_GUEST_LINES = 100;
export const MAX_GUEST_QUANTITY = 99;
export const MAX_GUEST_SLUG_LENGTH = 128;

/** Shared sanitizer for browser + server guest-bag entries. */
export function sanitizeGuestEntries(raw: unknown): GuestBagEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: GuestBagEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(0, MAX_GUEST_LINES)) {
    if (typeof item !== "object" || item === null) continue;
    const { slug, quantity } = item as { slug?: unknown; quantity?: unknown };
    if (
      typeof slug !== "string" ||
      slug.length < 1 ||
      slug.length > MAX_GUEST_SLUG_LENGTH
    ) {
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
