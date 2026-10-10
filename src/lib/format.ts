export function formatPrice(
  value: number,
  options?: { currency?: string; locale?: string },
): string {
  const { currency = "USD", locale = "en-US" } = options ?? {};
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Editorial long date ("March 4, 2026"). Accepts Date or ISO string. */
export function formatDate(
  value: Date | string,
  options?: { locale?: string },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(options?.locale ?? "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Exact money from integer cents ("$1,234.56"). Catalogue display uses
 * formatPrice; anything derived from cents — bag, subtotal, receipts —
 * uses this so the number always matches the underlying cents.
 */
export function formatCents(
  cents: number,
  options?: { currency?: string; locale?: string },
): string {
  const { currency = "USD", locale = "en-US" } = options ?? {};
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
