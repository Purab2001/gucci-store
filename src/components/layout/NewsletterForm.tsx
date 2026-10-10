"use client";

import { useState, type FormEvent } from "react";
import { Check, CircleAlert } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Correspondence signup. Client-validated with inline confirmation —
 * v1 keeps the list in the browser only (no newsletter backend yet),
 * so the form never navigates or posts to a placeholder action.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-sm text-ink">
        <Check className="h-4 w-4" aria-hidden="true" />
        First to know — the next letter arrives with the new season.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "newsletter-email-error" : undefined}
        className={`h-12 flex-1 border bg-canvas px-4 text-sm text-ink placeholder:text-stone focus:outline-none ${
          error ? "border-heritage" : "border-line focus:border-ink"
        }`}
      />
      <button type="submit" className="btn btn-primary w-full sm:w-auto">
        Subscribe
      </button>
      {error && (
        <p
          id="newsletter-email-error"
          role="alert"
          className="flex items-center justify-center gap-1.5 text-xs text-heritage sm:basis-full"
        >
          <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
