"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import type { AdminAvailabilityFormState } from "@/lib/admin-actions";

const INITIAL_STATE: AdminAvailabilityFormState = {
  ok: false,
  message: "",
  savedActive: null,
};

/**
 * Active/retired toggle for one product-list row. Server owns the write
 * (requireAdmin + single UPDATE); this form only mirrors pending state,
 * inline confirmation, and errors back — the same pattern as StockForm.
 */
export function AvailabilityForm({
  productName,
  isActive,
  formAction,
}: {
  productName: string;
  isActive: boolean;
  formAction: (
    prevState: AdminAvailabilityFormState,
    formData: FormData,
  ) => Promise<AdminAvailabilityFormState>;
}) {
  const [state, action, isPending] = useActionState(formAction, INITIAL_STATE);
  const confirmed = state.savedActive ?? isActive;
  const error = !state.ok && state.message ? state.message : null;

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <input
          type="hidden"
          name="makeActive"
          value={String(!confirmed)}
        />
        <span
          className={`eyebrow ${confirmed ? "text-ink" : "text-stone"}`}
          aria-live="polite"
        >
          {confirmed ? "Active" : "Retired"}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="link-luxe text-xs text-ink disabled:opacity-45"
          aria-label={
            confirmed ? `Retire ${productName}` : `Activate ${productName}`
          }
        >
          {isPending ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Saving…
            </span>
          ) : confirmed ? (
            "Retire"
          ) : (
            "Activate"
          )}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs leading-relaxed text-heritage">
          {error}
        </p>
      ) : (
        state.message && (
          <p role="status" className="text-xs leading-relaxed text-smoke">
            {state.message}
          </p>
        )
      )}
    </form>
  );
}
