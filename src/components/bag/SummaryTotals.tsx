import { formatCents } from "@/lib/format";

/**
 * Shared summary totals for the bag and checkout surfaces. Presentational
 * only — counts and cents come from the server-resolved bag (signed-in) or
 * the live catalogue preview (guest). Never reads prices from the browser.
 */
export function SummaryTotals({
  count,
  subtotalCents,
}: {
  /** Total units across available lines. */
  count: number;
  /** Subtotal in whole cents (live price_cents x quantity). */
  subtotalCents: number;
}) {
  const unitWord = count === 1 ? "piece" : "pieces";
  return (
    <dl className="divide-y divide-line border-y border-line">
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Items</dt>
        <dd className="text-right text-sm text-ink">
          {count} {unitWord}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Subtotal</dt>
        <dd className="text-right text-base font-medium text-ink">
          {formatCents(subtotalCents)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Shipping</dt>
        <dd className="text-right text-sm text-ink">Complimentary</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Total</dt>
        <dd className="text-right text-base font-medium text-ink">
          {formatCents(subtotalCents)}
        </dd>
      </div>
    </dl>
  );
}
