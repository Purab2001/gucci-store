"use client";

import { useCallback } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { startCheckoutSession } from "@/app/actions/stripe";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

interface EmbeddedCheckoutFormProps {
  /** Catalogue slug (what the reference snippet calls `productId`). */
  productSlug: string;
  /** Fires when the buyer completes payment (`redirect_on_completion` is `never`). */
  onComplete?: () => void;
}

export default function EmbeddedCheckoutForm({
  productSlug,
  onComplete,
}: EmbeddedCheckoutFormProps) {
  const fetchClientSecret = useCallback(
    () => startCheckoutSession(productSlug),
    [productSlug],
  );

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
