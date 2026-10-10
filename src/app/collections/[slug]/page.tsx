import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getAllCollectionSlugs,
  getCatalogProducts,
  getCollectionBySlug,
  getCollections,
} from "@/lib/products";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    return { title: "Collection not found — Gucci Store" };
  }
  return {
    title: `${collection.name} — Gucci Store`,
    description:
      collection.blurb ||
      `${collection.name} — considered pieces in leather, gold and dark acetate.`,
  };
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CollectionFallback />}>
      <CollectionDetails params={params} />
    </Suspense>
  );
}

async function CollectionDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [pieces, collections] = await Promise.all([
    getCatalogProducts({ categorySlug: collection.slug }),
    getCollections(),
  ]);
  const others = collections.filter((c) => c.slug !== collection.slug);

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      {/* ---------- Breadcrumb — restrained ---------- */}
      <nav aria-label="Breadcrumb" className="hairline-b bg-canvas">
        <div className="container-luxe flex items-center gap-3 overflow-x-auto py-3.5">
          <Link
            href="/"
            className="eyebrow shrink-0 whitespace-nowrap text-smoke"
          >
            Home
          </Link>
          <span aria-hidden="true" className="eyebrow shrink-0 text-stone">
            /
          </span>
          <Link
            href="/shop"
            className="eyebrow shrink-0 whitespace-nowrap text-smoke"
          >
            Shop
          </Link>
          <span aria-hidden="true" className="eyebrow shrink-0 text-stone">
            /
          </span>
          <span
            aria-current="page"
            className="eyebrow shrink-0 truncate whitespace-nowrap text-ink"
          >
            {collection.name}
          </span>
        </div>
      </nav>

      {/* ---------- Editorial header — imagery + information ---------- */}
      <section className="container-luxe py-10 sm:py-14">
        {collection.image ? (
          <div className="editorial-grid items-start">
            <div>
              <div className="img-frame">
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="eyebrow mt-3 text-stone">
                {collection.name} — Daylight, N.03
              </p>
            </div>
            <div className="max-w-md">
              <p className="eyebrow text-brass">
                Collection — {collection.name}
              </p>
              <h1 className="display mt-3">{collection.name}</h1>
              {collection.blurb ? (
                <p className="body-luxe mt-4">{collection.blurb}</p>
              ) : null}
              <div className="rule-double mt-6" aria-hidden="true" />
              <p className="body-luxe mt-6 text-sm">
                Considered proportions and a soft hand-feel — designed to
                be worn daily and kept for decades.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link href="/shop" className="link-luxe text-sm">
                  Shop all pieces
                </Link>
                <Link href="/new-arrivals" className="link-luxe text-sm">
                  New arrivals
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <p className="eyebrow text-brass">
              Collection — {collection.name}
            </p>
            <h1 className="display mt-3">{collection.name}</h1>
            <p className="body-luxe mt-4 max-w-md">
              Considered pieces in {collection.name.toLowerCase()} —
              sharp shapes, soft hand-feel, no excess hardware.
            </p>
          </div>
        )}
      </section>

      {/* ---------- Count bar ---------- */}
      <div className="hairline-t hairline-b bg-ivory">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-smoke" aria-live="polite">
            Showing {pieces.length}{" "}
            {pieces.length === 1 ? "piece" : "pieces"} — {collection.name}
          </p>
        </div>
      </div>

      {/* ---------- Product grid — imagery first ---------- */}
      <section
        aria-label={collection.name}
        className="container-luxe py-10 sm:py-14"
      >
        {pieces.length > 0 ? (
          <div className="product-grid">
            {pieces.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="container-narrow py-20 text-center">
            <p className="eyebrow text-brass">Nothing here yet</p>
            <h2 className="heading-section mt-3">
              No pieces in {collection.name}
            </h2>
            <p className="body-luxe mx-auto mt-4 max-w-sm text-sm">
              New pieces land regularly. Browse the full catalogue in the
              meantime.
            </p>
            <Link href="/shop" className="btn btn-secondary mt-8">
              Shop all pieces
            </Link>
          </div>
        )}
      </section>

      {/* ---------- Other collections — same system as home ---------- */}
      {others.length > 0 ? (
        <section className="hairline-t bg-ivory">
          <div className="container-luxe section-tight">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-brass">
                  Continue — Other collections
                </p>
                <h2 className="heading-section mt-3">Explore further</h2>
              </div>
              <Link href="/shop" className="link-luxe text-sm">
                View all pieces
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {others.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group flex flex-col bg-canvas"
                >
                  <div className="img-frame">
                    <Image
                      src={col.image}
                      alt={col.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 px-6 py-6 text-left">
                    <p className="eyebrow text-smoke">{col.name}</p>
                    <h3 className="font-display text-2xl leading-tight">
                      {col.name}
                    </h3>
                    {col.blurb ? (
                      <p className="body-luxe text-sm">{col.blurb}</p>
                    ) : null}
                    <span className="link-nav mt-3 inline-flex items-center gap-1.5">
                      Discover
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Quiet footer nav ---------- */}
      <div className="hairline-t">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-4 py-8">
          <Link
            href="/shop"
            className="link-nav inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to shop
          </Link>
          <Link
            href="/"
            className="link-nav inline-flex items-center gap-2"
          >
            Home
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function CollectionFallback() {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink" aria-hidden="true">
      <div className="hairline-b">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-stone">Loading collection…</p>
        </div>
      </div>
      <section className="container-luxe py-10 sm:py-14">
        <div className="editorial-grid items-start">
          <div className="img-frame">
            <div className="absolute inset-0 animate-pulse bg-fog" />
          </div>
          <div className="max-w-md">
            <div className="h-3 w-24 animate-pulse bg-linen" />
            <div className="mt-4 h-8 w-64 animate-pulse bg-linen" />
            <div className="mt-6 h-3 w-full animate-pulse bg-fog" />
            <div className="mt-2 h-3 w-5/6 animate-pulse bg-fog" />
          </div>
        </div>
      </section>
      <div className="hairline-t hairline-b bg-ivory">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-stone">Loading pieces…</p>
        </div>
      </div>
      <div className="container-luxe py-10 sm:py-14">
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
    </main>
  );
}
