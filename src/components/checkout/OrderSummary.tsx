import { formatCents } from "@/lib/format";

export interface OrderSummaryLine {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

/**
 * Receipt lines + total, rendered from snapshotted `order_items` — never
 * re-read from the catalogue, so the receipt always matches what was
 * charged. Shared by the paid and payment-confirming states.
 */
export function OrderSummary({
  lines,
  subtotalCents,
}: {
  lines: OrderSummaryLine[];
  subtotalCents: number;
}) {
  return (
    <div className="surface-card mt-10 max-w-xl">
      <ul aria-label="Order contents" className="divide-y divide-line">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-6 px-7 py-4 sm:px-9"
          >
            <div className="min-w-0">
              <p className="text-sm text-ink">
                {line.productName}{" "}
                <span className="text-smoke">× {line.quantity}</span>
              </p>
              <p className="mt-0.5 text-xs text-smoke">
                {formatCents(line.unitPriceCents)} each
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-ink">
              {formatCents(line.unitPriceCents * line.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-6 border-t border-line px-7 py-4 sm:px-9">
        <p className="eyebrow text-smoke">Total charged</p>
        <p className="text-base font-medium text-ink">
          {formatCents(subtotalCents)}
        </p>
      </div>
    </div>
  );
}
