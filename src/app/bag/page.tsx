import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BagLine } from "@/components/bag/BagLine";
import { GuestBagView } from "@/components/bag/GuestBagView";
import { getBagAction } from "@/lib/cart-actions";
import { formatCents } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your bag — Gucci Store",
  description: "Review the pieces in your shopping bag.",
};

// Reads the session at request time — the bag is per-user and live.
export const instant = false;

export default async function BagPage() {
  // Public route: signed-in shoppers get the server (DB) bag, guests get
  // the client (localStorage) bag. Neither branch redirects to sign-in.
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="flex flex-1 flex-col bg-canvas text-ink">
        <GuestBagView />
      </main>
    );
  }
  const bag = await getBagAction();
  const unitWord = bag.count === 1 ? "piece" : "pieces";

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-luxe section">
        <p className="eyebrow text-brass">Bag</p>
        <h1 className="display mt-3">
          {bag.items.length === 0
            ? "Your bag is empty"
            : `Your bag — ${bag.count} ${unitWord}`}
        </h1>
        <p className="body-luxe mt-4 max-w-md text-sm">
          {bag.items.length === 0
            ? "Considered essentials in leather, gold and dark acetate — chosen slowly, kept for decades."
            : "Prices follow the current catalogue. Quantities never exceed what the atelier holds."}
        </p>

        {bag.items.length === 0 ? (
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
              {bag.items.map((item) => (
                <BagLine key={item.productId} item={item} />
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
                    {formatCents(bag.subtotalCents)}
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
    </main>
  );
}
