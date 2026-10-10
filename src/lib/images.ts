// Single source of truth for product/collection image hosts.
//
// The storefront renders with next/image (remotePatterns in next.config.ts),
// Stripe Checkout fetches the same URLs for product_data.images, and the
// admin form validates them. All three must agree — keep this list in sync
// with next.config.ts.
export const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"] as const;

/** True when the URL is an absolute https URL on an allowed host. */
export function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(url.host);
  } catch {
    return false;
  }
}

/** True when Stripe can fetch the URL for Checkout product images. */
export function isStripeImageUrl(raw: string): boolean {
  return isAllowedImageUrl(raw);
}
