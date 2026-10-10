import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout cancelled — Gucci Store",
  description: "Your checkout was cancelled and your bag is unchanged.",
};

/** Static landing for Stripe `cancel_url`. Nothing was charged; the bag is untouched. */
export default function CheckoutCancelledPage() {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-luxe section">
        <p className="eyebrow text-brass">Checkout cancelled</p>
        <h1 className="display mt-3">No charge made — your bag is waiting</h1>
        <p className="body-luxe mt-4 max-w-md text-sm">
          You left checkout before paying. Every piece is still in your bag whenever you are ready.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/bag" className="btn btn-primary">
            Return to your bag
          </Link>
          <Link href="/shop" className="link-nav inline-flex items-center gap-2">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to shop
          </Link>
        </div>
      </section>
    </main>
  );
}
