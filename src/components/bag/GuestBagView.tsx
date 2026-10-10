"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import { BagLine } from "@/components/bag/BagLine";
import { useGuestBag } from "@/components/bag/CartProvider";
import { SummaryTotals } from "@/components/bag/SummaryTotals";

/**
 * Logged-out /bag content. Reads the same cart context as the header
 * dropdown, so adds on product pages appear here and in the menu together.
 * Rows reuse the shared BagLine with context-backed mutations; money and
 * stock always come from the resolved preview, never from the client store.
 */
export function GuestBagView() {
  const { entries, preview, previewPending, setQuantity, remove } =
    useGuestBag();
  const unitWord = preview.count === 1 ? "piece" : "pieces";

  async function handleQuantity(productId: string, next: number) {
    const line = preview.items.find((i) => i.productId === productId);
    if (!line) {
      return { ok: false, message: "That piece is no longer in your bag." };
    }
    if (next < 1) {
      remove(line.slug);
    } else {
      setQuantity(line.slug, next);
    }
    return { ok: true };
  }

  async function handleRemove(productId: string) {
    const line = preview.items.find((i) => i.productId === productId);
    if (!line) {
      return { ok: false, message: "That piece is no longer in your bag." };
    }
    remove(line.slug);
    return { ok: true };
  }

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
              <BagLine
                key={item.productId}
                item={item}
                onQuantity={handleQuantity}
                onRemove={handleRemove}
              />
            ))}
          </ul>

          <aside
            aria-label="Bag summary"
            className="border border-line bg-ivory px-7 py-8 sm:px-9 lg:sticky lg:top-8"
          >
            <p className="eyebrow text-brass">Summary</p>
            <div className="mt-6">
              <SummaryTotals
                count={preview.count}
                subtotalCents={preview.subtotalCents}
              />
            </div>
            <p className="mt-6 text-xs leading-relaxed text-stone">
              Subtotal follows current catalogue pricing. Complimentary
              shipping and 30-day returns on every order.
            </p>
            <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-smoke">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Sign in at checkout to complete your order.
            </p>
            <Link
              href="/sign-in?callbackURL=%2Fbag"
              className="btn btn-primary mt-6 w-full"
            >
              Sign in to check out
            </Link>
            <Link href="/shop" className="btn btn-secondary mt-3 w-full">
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
