"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, Minus, Plus } from "lucide-react";
import { useGuestBag } from "@/components/bag/CartProvider";
import type { BagItem } from "@/lib/cart-types";
import { formatCents } from "@/lib/format";

/**
 * One guest bag line: packshot, live unit price, quantity stepper, line
 * total, remove. Writes go straight to the shared cart context (persisted
 * to localStorage); money and stock always come from the resolved preview,
 * never from the client store.
 */
function GuestBagLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: BagItem;
  onQuantity: (slug: string, next: number) => void;
  onRemove: (slug: string) => void;
}) {
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
            onClick={() => onRemove(item.slug)}
            className="link-luxe mt-2 self-start text-sm"
          >
            Remove
          </button>
        </div>
      </li>
    );
  }

  const atCap = item.quantity >= item.stockQuantity;

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
              onClick={() => onQuantity(item.slug, item.quantity - 1)}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-ivory"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
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
              disabled={atCap}
              title={atCap ? `Only ${item.stockQuantity} available` : undefined}
              onClick={() => onQuantity(item.slug, item.quantity + 1)}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-ivory disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.slug)}
            className="link-luxe text-sm"
          >
            Remove
          </button>
        </div>

        {atCap && (
          <p className="mt-2 text-xs leading-relaxed text-smoke">
            Only {item.stockQuantity} available in the atelier.
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Logged-out /bag content. Reads the same cart context as the header
 * dropdown, so adds on product pages appear here and in the menu together.
 */
export function GuestBagView() {
  const { entries, preview, previewPending, setQuantity, remove } =
    useGuestBag();
  const unitWord = preview.count === 1 ? "piece" : "pieces";

  return (
    <section className="container-luxe section">
      <p className="eyebrow text-brass">Bag</p>
      <h1 className="display mt-3">
        {preview.items.length === 0
          ? "Your bag is empty"
          : `Your bag — ${preview.count} ${unitWord}`}
      </h1>
      <p className="body-luxe mt-4 max-w-md text-sm">
        {preview.items.length === 0
          ? "Considered essentials in leather, gold and dark acetate — chosen slowly, kept for decades."
          : "Prices follow the current catalogue. Quantities never exceed what the atelier holds."}
      </p>

      {previewPending && entries.length > 0 && preview.items.length === 0 ? (
        <p role="status" className="mt-10 text-sm text-smoke">
          Loading your bag…
        </p>
      ) : preview.items.length === 0 ? (
        <div className="surface-card mt-10 max-w-xl px-7 py-10 text-center sm:px-12">
          <p className="eyebrow text-smoke">Nothing here yet</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-primary w-full sm:w-auto">
              Continue shopping
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/new-arrivals"
              className="btn btn-secondary w-full sm:w-auto"
            >
              New arrivals
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <ul
            aria-label="Bag contents"
            className="surface-card divide-y divide-line"
          >
            {preview.items.map((item) => (
              <GuestBagLine
                key={item.slug}
                item={item}
                onQuantity={setQuantity}
                onRemove={remove}
              />
            ))}
          </ul>

          <aside
            aria-label="Bag summary"
            className="border border-line bg-ivory px-7 py-8 sm:px-9 lg:sticky lg:top-8"
          >
            <p className="eyebrow text-brass">Summary</p>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Subtotal</dt>
                <dd className="text-right text-base font-medium text-ink">
                  {formatCents(preview.subtotalCents)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Shipping</dt>
                <dd className="text-right text-sm text-ink">Complimentary</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-stone">
              Subtotal follows current catalogue pricing. Complimentary
              shipping and 30-day returns on every order.
            </p>
            <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-smoke">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Sign in at checkout to complete your order.
            </p>
            <Link href="/shop" className="btn btn-secondary mt-6 w-full">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <Link href="/shop" className="link-nav inline-flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to shop
        </Link>
      </div>
    </section>
  );
}
