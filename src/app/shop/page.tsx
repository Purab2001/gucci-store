import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShopListing, ShopListingFallback } from "@/components/shop/ShopListing";
import type { ShopQuery } from "@/components/shop/ShopListing";

export const metadata: Metadata = {
  title: "Shop All Pieces — Gucci Store",
  description:
    "Browse considered essentials in leather, gold and dark acetate.",
};

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopQuery>;
}) {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      {/* ---------- Editorial header (static, prerender-safe) ---------- */}
      <section className="container-luxe pt-14 pb-10 sm:pt-20 sm:pb-12">
        <p className="eyebrow text-brass">Shop — N.02</p>
        <h1 className="display mt-3 max-w-2xl">All pieces, considered</h1>
        <p className="body-luxe mt-4 max-w-md">
          Sixteen quiet essentials in leather, gold and dark acetate.
          Search, filter by family, sort with restraint — the imagery
          does the rest.
        </p>
      </section>

      {/* ---------- Dynamic filter + grid (streamed) ---------- */}
      <Suspense fallback={<ShopListingFallback />}>
        <ShopListing searchParams={searchParams} />
      </Suspense>

      {/* ---------- Quiet footer note (static) ---------- */}
      <div className="hairline-t">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-4 py-8">
          <p className="eyebrow text-smoke">
            Grained leather — Brass — Silk
          </p>
          <Link href="/" className="link-luxe text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
