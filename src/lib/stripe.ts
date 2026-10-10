import "server-only";

import Stripe from "stripe";

// Lazy singleton: importing this module must not throw at build time (so
// prerendered shells that transitively import it stay green without keys).
// The throw happens on first use, when the secret is genuinely required.
// Use a restricted key (rk_...) with the minimum permissions for Checkout
// Sessions, PaymentIntent reads, and refunds — never a live secret in code.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Copy .env.example to .env and set a restricted Stripe key.",
    );
  }
  client = new Stripe(secret);
  return client;
}
