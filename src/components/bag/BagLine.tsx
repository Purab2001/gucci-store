"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleAlert, LoaderCircle, Minus, Plus } from "lucide-react";
import {
  removeFromBagAction,
  updateBagQuantityAction,
} from "@/lib/cart-actions";
import type { BagItem } from "@/lib/cart-types";
import { formatCents } from "@/lib/format";

/**
 * One bag line: packshot, live unit price, quantity stepper, line total,
 * remove. All writes go through server actions (stock-clamped there);
 * the page re-renders from revalidatePath("/bag").
 */
export function BagLine({ item }: { item: BagItem }) {
  const [pending, setPending] = useState<"dec" | "inc" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    kind: "dec" | "inc" | "remove",
    fn: () => Promise<{ ok: boolean; message?: string }>,
  ) {
    if (pending) return;
    setPending(kind);
    setError(null);
    try {
      const result = await fn();
      if (!result.ok) {
        setError(
          "message" in result && result.message
            ? result.message
            : "Could not update your bag.",
        );
        return;
      }
      window.dispatchEvent(new Event("bag:changed"));
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  if (!item.available) {
    return (
      <li className="flex gap-5 px-7 py-6 opacity-70 sm:px-9">
        <div className="img-frame img-frame-square w-24 shrink-0 sm:w-28">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="eyebrow text-smoke">No longer available</p>
          <p className="product-card-name text-left text-ink">{item.name}</p>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run("remove", () => removeFromBagAction(item.productId))}
            className="link-luxe mt-2 self-start text-sm disabled:opacity-40"
          >
            {pending === "remove" ? "Removing…" : "Remove"}
          </button>
          {error && (
            <p role="alert" className="text-xs leading-relaxed text-heritage">
              {error}
            </p>
          )}
        </div>
      </li>
    );
  }

  const atCap = item.quantity >= item.stockQuantity;
  const busy = pending !== null;

  return (
    <li className="flex gap-5 px-7 py-6 sm:px-9">
      <Link
        href={`/shop/${item.slug}`}
        className="img-frame img-frame-square w-24 shrink-0 sm:w-28"
        aria-label={item.name}
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="112px"
          className="object-cover"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/shop/${item.slug}`}
              className="product-card-name text-left text-ink decoration-1 underline-offset-4 hover:underline"
            >
              {item.name}
            </Link>
            <p className="product-card-price mt-1">
              {formatCents(item.priceCents)} each
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium text-ink">
            {formatCents(item.priceCents * item.quantity)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div
            role="group"
            aria-label={`Quantity for ${item.name}`}
            className="flex items-center border border-line"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={busy}
              onClick={() =>
                run("dec", () =>
                  updateBagQuantityAction(item.productId, item.quantity - 1),
                )
              }
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-ivory disabled:opacity-40"
            >
              {pending === "dec" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Minus className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <span
              aria-live="polite"
              aria-label={`Quantity ${item.quantity}`}
              className="w-10 text-center text-sm tabular-nums"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || atCap}
              title={atCap ? `Only ${item.stockQuantity} available` : undefined}
              onClick={() =>
                run("inc", () =>
                  updateBagQuantityAction(item.productId, item.quantity + 1),
                )
              }
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-ivory disabled:opacity-40"
            >
              {pending === "inc" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("remove", () => removeFromBagAction(item.productId))}
            className="link-luxe text-sm disabled:opacity-40"
          >
            {pending === "remove" ? "Removing…" : "Remove"}
          </button>
        </div>

        {atCap && (
          <p className="mt-2 text-xs leading-relaxed text-smoke">
            Only {item.stockQuantity} available in the atelier.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-heritage"
          >
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
