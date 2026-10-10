/**
 * Order reference block for the confirmation experience. Rendered from the
 * confirmed order row (reference + placed date + owning account), so the
 * receipt answers "which order, when, for whom" at a glance. Shared by the
 * paid and payment-confirming states.
 */
export function OrderMeta({
  reference,
  placedOn,
  email,
}: {
  /** Short public reference (order id prefix — never the Stripe secret). */
  reference: string;
  /** Pre-formatted placed/confirmation date. */
  placedOn: string;
  /** Account that owns the order. */
  email: string;
}) {
  return (
    <dl className="mt-8 max-w-xl divide-y divide-line border-y border-line">
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Order</dt>
        <dd className="text-right text-sm text-ink">{reference}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Placed</dt>
        <dd className="text-right text-sm text-ink">{placedOn}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="eyebrow shrink-0 text-smoke">Receipt for</dt>
        <dd className="text-right text-sm break-all text-ink">{email}</dd>
      </div>
    </dl>
  );
}
