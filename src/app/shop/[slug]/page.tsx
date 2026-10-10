import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { AddToBagButton } from "@/components/bag/AddToBagButton";
import { ContinueNav } from "@/components/layout/ContinueNav";
import { formatPrice } from "@/lib/format";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products";
import { stockState } from "@/lib/stock";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Piece not found — Gucci Store" };
  }
  return {
    title: `${product.name} — Gucci Store`,
    description: `${product.name} in ${product.category}, ${formatPrice(product.price)}.`,
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailFallback />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stock = stockState(product.stockQuantity);
  const related = await getRelatedProducts(product, 4);
  const detail =
    product.description ??
    "Considered proportions and a soft hand-feel — designed to be worn daily and kept for decades.";
  const material = product.material ?? "Selected natural materials";

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
          <Link
                href={`/collections/${product.categorySlug}`}
            className="eyebrow shrink-0 whitespace-nowrap text-smoke"
          >
            {product.category}
          </Link>
          <span aria-hidden="true" className="eyebrow shrink-0 text-stone">
            /
          </span>
          <span
            aria-current="page"
            className="eyebrow shrink-0 truncate whitespace-nowrap text-ink"
          >
            {product.name}
          </span>
        </div>
      </nav>

      {/* ---------- Detail — imagery + information ---------- */}
      <section className="container-luxe py-10 sm:py-14">
        <div className="editorial-grid items-start">
          <div className="lg:sticky lg:top-24">
            <div className="img-frame">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {product.tag ? (
                <span className="eyebrow absolute top-3 left-3 border border-line bg-canvas px-2.5 py-1.5 text-ink">
                  {product.tag}
                </span>
              ) : null}
            </div>
            <p className="eyebrow mt-3 text-stone">
              {product.category} — Daylight, N.02
            </p>
          </div>

          <div className="max-w-md">
            <p className="eyebrow text-brass">
              Shop — {product.category}
            </p>
            <h1 className="display mt-3">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink">
              {formatPrice(product.price)}
            </p>

            <div className="rule-double mt-6" aria-hidden="true" />

            <p className="body-luxe mt-6">{detail}</p>

            {/* ---------- Stock state — derived from quantity ---------- */}
            <div
              className="mt-6 flex items-center gap-3"
              role="status"
              aria-label={`${stock.label}. ${stock.note}`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 ${stock.dotClass}`}
              />
              <p className="eyebrow text-ink">{stock.label}</p>
              <span aria-hidden="true" className="eyebrow text-stone">
                —
              </span>
              <p className="text-sm leading-relaxed text-smoke">
                {stock.note}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <AddToBagButton slug={product.slug} outOfStock={stock.status === "out"} />
              <p className="text-center text-xs leading-relaxed text-stone">
                Complimentary shipping and 30-day returns.
              </p>
            </div>

            <dl className="mt-8 divide-y divide-line border-y border-line">
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Category</dt>
                <dd className="text-right text-sm text-ink">
                  {product.category}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Material</dt>
                <dd className="text-right text-sm leading-relaxed text-ink">
                  {material}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Reference</dt>
                <dd className="text-right text-sm text-ink">
                  {product.slug}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="eyebrow shrink-0 text-smoke">Care</dt>
                <dd className="text-right text-sm leading-relaxed text-ink">
                  Two-year guarantee, repaired for life
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/shop" className="link-luxe text-sm">
                Private assistance
              </Link>
              <Link
            href={`/collections/${product.categorySlug}`}
                className="link-luxe text-sm"
              >
                More {product.category.toLowerCase()}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Related — same system as listing ---------- */}
      <section className="hairline-t bg-ivory">
        <div className="container-luxe section-tight">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-brass">Continue — Related pieces</p>
              <h2 className="heading-section mt-3">Worn alongside</h2>
            </div>
            <Link href="/shop" className="link-luxe text-sm">
              View all pieces
            </Link>
          </div>
          <div className="product-grid mt-10">
            {related.map((item, i) => (
              <ProductCard key={item.id} product={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Continue — forward only (breadcrumb already covers Home / Shop / Category) ---------- */}
      <ContinueNav
        kicker="Continue — Further afield"
        links={[
          {
            href: `/collections/${product.categorySlug}`,
            label: `More ${product.category.toLowerCase()}`,
          },
          { href: "/new-arrivals", label: "New arrivals" },
        ]}
      />
    </main>
  );
}

function ProductDetailFallback() {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink" aria-hidden="true">
      <div className="hairline-b">
        <div className="container-luxe py-3.5">
          <p className="eyebrow text-stone">Loading piece…</p>
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
    </main>
  );
}
