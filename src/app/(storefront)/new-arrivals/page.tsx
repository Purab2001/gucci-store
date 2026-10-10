import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ContinueNav } from "@/components/layout/ContinueNav";
import { getNewArrivals } from "@/lib/products";

export const metadata: Metadata = {
  title: "New Arrivals — Gucci Store",
  description:
    "The newest pieces in leather, gold and dark acetate — ordered by arrival.",
};

export default function NewArrivalsPage() {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      {/* ---------- Editorial header (static, prerender-safe) ---------- */}
      <section className="container-luxe pt-14 pb-10 sm:pt-20 sm:pb-12">
        <p className="eyebrow text-brass">New Arrivals — N.01</p>
        <h1 className="display mt-3 max-w-2xl">Just landed, quietly</h1>
        <p className="body-luxe mt-4 max-w-md">
          The newest pieces in leather, gold and dark acetate — most
          recent first, no excess, no noise.
        </p>
      </section>

      {/* ---------- Newest-first grid (streamed) ---------- */}
      <Suspense fallback={<NewArrivalsFallback />}>
        <NewArrivalsGrid />
      </Suspense>

      {/* ---------- Continue — forward only (header already covers Home) ---------- */}
      <ContinueNav
        kicker="Continue — The catalogue"
        links={[
          { href: "/shop", label: "Shop all pieces" },
          { href: "/about", label: "About the maison" },
        ]}
      />
    </main>
  );
}

async function NewArrivalsGrid() {
  const arrivals = await getNewArrivals();

  return (
    <>
      <div className="hairline-t hairline-b bg-ivory">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-smoke" aria-live="polite">
            Showing {arrivals.length} newest{" "}
            {arrivals.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </div>

      <section aria-label="New arrivals" className="container-luxe py-10 sm:py-14">
        {arrivals.length > 0 ? (
          <div className="product-grid">
            {arrivals.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="container-narrow py-20 text-center">
            <p className="eyebrow text-brass">Nothing new yet</p>
            <h2 className="heading-section mt-3">Check back soon</h2>
            <p className="body-luxe mx-auto mt-4 max-w-sm text-sm">
              New pieces land regularly. Browse the full catalogue in
              the meantime.
            </p>
            <Link href="/shop" className="btn btn-secondary mt-8">
              Shop all pieces
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

function NewArrivalsFallback() {
  return (
    <>
      <div className="hairline-t hairline-b bg-ivory" aria-hidden="true">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-stone">Loading new arrivals…</p>
        </div>
      </div>
      <div className="container-luxe py-10 sm:py-14" aria-hidden="true">
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-canvas">
              <div className="img-frame">
                <div className="absolute inset-0 animate-pulse bg-fog" />
              </div>
              <div className="product-card-body">
                <div className="h-3 w-20 animate-pulse bg-linen" />
                <div className="h-3 w-32 animate-pulse bg-linen" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
