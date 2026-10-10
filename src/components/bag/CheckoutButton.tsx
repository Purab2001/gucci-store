"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { createCheckoutSessionAction } from "@/lib/checkout-actions";

/**
 * Signed-in bag checkout button. Calls the server action (which rebuilds
 * amounts from the live catalogue and revalidates stock), then hands off to
 * Stripe-hosted Checkout via a full redirect. Disabled while pending so a
 * double-click cannot create duplicate sessions.
 */
export function CheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await createCheckoutSessionAction();
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      setError(result.message);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      // Only reached on failure — success navigates away.
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="btn btn-primary w-full disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Redirecting to checkout…
          </>
        ) : (
          "Proceed to checkout"
        )}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-heritage"
        >
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
