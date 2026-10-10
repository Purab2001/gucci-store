"use server";

import { getStripe } from "@/lib/stripe";
import { getProductBySlug } from "@/lib/products";

// Embedded Checkout server action (single-product session).
// Catalogue lookup: routes in this storefront use the product `slug` as the
// public identifier, so the `productSlug` argument is what the reference
// snippet calls `productId`. Amounts are rebuilt from a live catalogue read —
// the browser supplies no price.
//
// NOTE: this creates the Stripe session only. Fulfilment still belongs in the
// signed webhook (src/app/api/stripe/webhook/route.ts) before launch — the
// success/complete callback must never write order state.

// Dashboard tracking label for this checkout flow (Stripe's
// `integration_identifier`, valid on API 2026-03-25.dahlia+ — the bundled
// SDK defaults to 2026-09-30.endive). Fixed value: a per-session random
// suffix would explode Dashboard cardinality. The 8-letter suffix only
// de-collides this flow from the bag checkout in src/lib/checkout-actions.ts.
const INTEGRATION_IDENTIFIER = "gucci-store-embedded-mKqRzvWx";

export async function startCheckoutSession(
  productSlug: string,
): Promise<string> {
  // Implement your product catalog lookup.
  const product = await getProductBySlug(productSlug);
  if (!product) {
    throw new Error(`Product not found: ${productSlug}`);
  }
  if (product.stockQuantity <= 0) {
    throw new Error(`"${product.name}" is currently out of stock.`);
  }
  // mapProduct() returns dollars; Stripe takes integer cents.
  const unitAmount = Math.round(product.price * 100);
  if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
    throw new Error(`Invalid price for "${product.name}".`);
  }

  // Create Checkout Sessions from body params.
  // No `payment_method_types`: omitting it enables dynamic payment methods,
  // so Stripe shows the most relevant methods per customer with zero code
  // changes.
  const session = await getStripe().checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            ...(product.description
              ? { description: product.description }
              : {}),
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    integration_identifier: INTEGRATION_IDENTIFIER,
  });

  if (!session.client_secret) {
    throw new Error("Couldn't start checkout. Please try again.");
  }
  return session.client_secret;
}
