"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { stockState } from "@/lib/stock";
import type { AdminStockFormState } from "@/lib/admin-actions";

const INITIAL_STATE: AdminStockFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
  savedQuantity: null,
};

/**
 * Inline stock editor for one product-list row. Absolute quantities only
 * (no deltas): the value is validated server-side by updateStockAction and
 * written with a single SET, so two admins can never merge stale deltas.
 * Stays on the list with inline feedback instead of redirecting.
 */
export function StockForm({
  productId,
  productName,
  stockQuantity,
  formAction,
}: {
  productId: string;
  productName: string;
  stockQuantity: number;
  formAction: (
    prevState: AdminStockFormState,
    formData: FormData,
  ) => Promise<AdminStockFormState>;
}) {
  const [state, action, isPending] = useActionState(formAction, INITIAL_STATE);
  // After a save the server echoes the confirmed quantity; until then the
  // row shows the value loaded with the page.
  const confirmed = state.savedQuantity ?? stockQuantity;
  const preview = stockState(confirmed);
  const error = state.fieldErrors.stockQuantity;

  return (
    <form action={action} noValidate className="flex min-w-44 flex-col gap-1.5">
      <p
        className="flex items-center gap-2 text-xs text-stone"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className={`inline-block size-1.5 rounded-full ${preview.dotClass}`}
        />
        {`${preview.label} · ${confirmed}`}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor={`stock-${productId}`} className="sr-only">
          Stock for {productName}
        </label>
        <input
          id={`stock-${productId}`}
          name="stockQuantity"
          type="number"
          required
          min={0}
          max={999999}
          step={1}
          defaultValue={stockQuantity}
          key={state.savedQuantity ?? productId}
          disabled={isPending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `stock-${productId}-error` : undefined}
          className={`h-10 w-24 border bg-canvas px-3 text-sm text-ink focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${error ? "border-heritage focus:border-heritage" : "border-line focus:border-ink"}`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="link-luxe text-xs text-ink disabled:opacity-45"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Saving…
            </span>
          ) : (
            "Save"
          )}
        </button>
      </div>
      {error ? (
        <p
          id={`stock-${productId}-error`}
          role="alert"
          className="text-xs leading-relaxed text-heritage"
        >
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
