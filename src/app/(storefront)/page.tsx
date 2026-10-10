import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import {
  atelierImage,
  editorialImage,
  editorialTiles,
  heroImage,
} from "@/data/products";
import { getCollections, getFeaturedProducts } from "@/lib/products";

const services = [
  {
    icon: Truck,
    title: "Complimentary Shipping",
    copy: "Signature packaging on every order",
  },
  {
    icon: RefreshCcw,
    title: "Effortless Returns",
    copy: "Within 30 days, always pressed",
  },
  {
    icon: ShieldCheck,
    title: "Certified Craft",
    copy: "Two-year guarantee included",
  },
  {
    icon: Headphones,
    title: "Private Assistance",
    copy: "Styling advice on request",
  },
];

const craftSpecs = [
  { term: "Material", detail: "Grained calf leather, twill lining" },
  { term: "Construction", detail: "Saddle-stitched, painted edges" },
  { term: "Guarantee", detail: "Two years, repaired for life" },
];

export default async function Home() {
  const [featuredProducts, collections] = await Promise.all([
    getFeaturedProducts(),
    getCollections(),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      {/* ---------- Hero — full-bleed editorial ---------- */}
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-onyx text-ivory sm:min-h-[92svh]">
        <Image
          src={heroImage}
          alt="Editorial fashion portrait in soft daylight"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10"
        />
        <div className="container-luxe relative pt-24 pb-14 sm:pb-20">
          <div className="max-w-2xl">
            <p className="eyebrow text-ivory/80">
              N.01 — Autumn Winter 2026
            </p>
            <h1 className="display-hero mt-5">
              Elegance, worn
              <br />
              with ease
            </h1>
            <p className="body-luxe mt-5 max-w-md text-ivory/85">
              Sculpted leather, soft tailoring and polished accents —
              photographed in daylight, made for everyday ceremony.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/shop" className="btn btn-light w-full sm:w-auto">
                Shop the icons
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#collections"
                className="btn btn-outline-light w-full sm:w-auto"
              >
                Featured collections
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-3 text-ivory/60">
              <span aria-hidden="true" className="h-px w-10 bg-ivory/40" />
              <p className="eyebrow">Scroll to explore</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Assurance strip ---------- */}
      <div className="hairline-b bg-ivory">
        <div className="container-luxe grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            "Complimentary shipping",
            "Signature packaging",
            "30-day returns",
          ].map((item) => (
            <p
              key={item}
              className="eyebrow py-3.5 text-center text-smoke sm:px-4"
            >
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* ---------- Featured collections ---------- */}
      <section id="collections" className="container-luxe section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow text-brass">01 — Featured collections</p>
            <h2 className="heading-section mt-3">
              Three studies in proportion
            </h2>
          </div>
          <Link href="/shop" className="link-luxe text-sm">
            View all pieces
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => (
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
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow text-smoke">{col.name}</p>
                  <p className="eyebrow text-stone">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                </div>
                <h3 className="font-display text-2xl leading-tight">
                  {col.name}
                </h3>
                <p className="body-luxe text-sm">{col.blurb}</p>
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
      </section>

      {/* ---------- Product focus ---------- */}
      <section id="icons" className="hairline-t bg-ivory">
        <div className="container-luxe section">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow text-brass">02 — Icons of the house</p>
              <h2 className="display mt-3">Carried daily, kept forever</h2>
              <p className="body-luxe mt-4 max-w-md">
                {featuredProducts.length} quiet essentials in leather, gold
                and dark acetate — sharp shapes, soft hand-feel, no excess
                hardware.
              </p>
            </div>
            <Link href="/shop" className="link-luxe text-sm">
              View all pieces
            </Link>
          </div>

          <div className="product-grid mt-12">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <p className="eyebrow text-smoke">
              {featuredProducts.length}{" "}
              {featuredProducts.length === 1 ? "piece" : "pieces"} — Leather,
              gold, acetate
            </p>
            <Link href="/shop" className="btn btn-secondary">
              Explore the edit
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Editorial split ---------- */}
      <section className="container-luxe section">
        <div className="editorial-grid">
          <figure>
            <div className="img-frame">
              <Image
                src={editorialImage}
                alt="Clothing rail in a quiet atelier"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="eyebrow mt-3 text-stone">
              Atelier rail — Daylight, N.03
            </figcaption>
          </figure>
          <div className="max-w-md">
            <p className="eyebrow text-brass">03 — The craft</p>
            <h2 className="heading-section mt-3">
              Cut with restraint, finished by hand
            </h2>
            <div className="rule-double mt-6" aria-hidden="true" />
            <p className="body-luxe mt-6">
              Each silhouette begins on paper — a single line for the
              shoulder, a single curve for the handle. Seams are
              saddle-stitched, edges painted and polished, linings cut
              from breathable cotton twill.
            </p>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {craftSpecs.map((spec) => (
                <div
                  key={spec.term}
                  className="flex items-baseline justify-between gap-6 py-3"
                >
                  <dt className="eyebrow shrink-0 text-smoke">
                    {spec.term}
                  </dt>
                  <dd className="text-right text-sm leading-relaxed text-ink">
                    {spec.detail}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="#atelier" className="btn btn-primary">
                Inside the atelier
              </Link>
              <Link href="#stories" className="link-luxe text-sm">
                Read the stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Atelier banner — forest full-bleed ---------- */}
      <section
        id="atelier"
        className="relative isolate overflow-hidden bg-forest text-ivory"
      >
        <Image
          src={atelierImage}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-forest/40 via-forest/60 to-forest/80"
        />
        <div className="container-narrow relative section text-center">
          <p className="eyebrow text-gold">04 — Atelier, Est. 1921</p>
          <h2 className="display mt-4">
            A century of leather, kept in the family
          </h2>
          <p className="eyebrow mt-6 text-ivory/60">
            Tanning — Casting — Printing
          </p>
          <p className="body-luxe mx-auto mt-4 max-w-md text-ivory/80">
            Vegetable tanning, brass casting and silk printing under one
            roof. Slow processes, repaired for life.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-light w-full sm:w-auto">
              Shop bestsellers
            </Link>
            <Link
              href="#stories"
              className="btn btn-outline-light w-full sm:w-auto"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Editorial tiles ---------- */}
      <section id="stories" className="container-luxe section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-brass">05 — Journal</p>
            <h2 className="heading-section mt-3">Notes on wearing</h2>
          </div>
          <Link href="#stories" className="link-luxe text-sm">
            All stories
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {editorialTiles.map((tile, i) => (
            <article key={tile.id} className="surface-card overflow-hidden">
              <div className="img-frame img-frame-wide">
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="px-7 py-7 sm:px-9">
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow text-brass">{tile.eyebrow}</p>
                  <p className="eyebrow text-stone">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                </div>
                <h3 className="font-display mt-3 text-2xl leading-snug">
                  {tile.title}
                </h3>
                <p className="body-luxe mt-2 text-sm">{tile.copy}</p>
                <span className="link-nav mt-4 inline-flex items-center gap-1.5">
                  Read story
                  <ArrowUpRight
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="hairline-t bg-ivory">
        <div className="container-luxe section-tight">
          <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="flex flex-col items-start gap-2 bg-canvas px-7 py-8 text-left"
              >
                <s.icon
                  className="h-5 w-5 text-forest"
                  aria-hidden="true"
                />
                <h3 className="eyebrow mt-3 text-ink">{s.title}</h3>
                <p className="text-sm leading-relaxed text-smoke">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className="container-narrow section text-center">
        <p className="eyebrow text-brass">06 — Correspondence</p>
        <h2 className="heading-section mt-3">First to know, quietly</h2>
        <p className="body-luxe mx-auto mt-4 max-w-md text-sm">
          New arrivals and atelier notes, once a month. No noise —
          unsubscribe anytime.
        </p>
        <NewsletterForm />
        <p className="mt-4 text-xs leading-relaxed text-stone">
          One letter a month. Private, always.
        </p>
      </section>
    </main>
  );
}
