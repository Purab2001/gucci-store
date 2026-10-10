import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Scissors, ShieldCheck } from "lucide-react";
import { ContinueNav } from "@/components/layout/ContinueNav";
import { atelierImage, editorialImage } from "@/data/products";

export const metadata: Metadata = {
  title: "About the Maison — Gucci Store",
  description:
    "A quiet atelier story — cut with restraint, tanned slowly, and repaired for life.",
};

const principles = [
  {
    icon: Scissors,
    title: "Cut With Restraint",
    copy: "One line for the shoulder, one curve for the handle. Nothing decorative, nothing spare.",
  },
  {
    icon: Leaf,
    title: "Tanned Slowly",
    copy: "Vegetable tanning, brass casting and silk printing under one roof. Slow processes, soft hand-feel.",
  },
  {
    icon: ShieldCheck,
    title: "Kept For Life",
    copy: "Two-year guarantee on every piece, repaired for life. Carried daily, kept forever.",
  },
];

const milestones = [
  {
    era: "1921",
    title: "A family workshop",
    copy: "A single bench for cutting and stitching leather — saddles first, then bags built to outlast them.",
  },
  {
    era: "1960",
    title: "Proportion as signature",
    copy: "Sharp shapes, soft construction. The house settles on quiet hardware and grained calf leather.",
  },
  {
    era: "1990",
    title: "One roof, three crafts",
    copy: "Tanning, casting and printing brought together so every edge, clasp and lining stays in family hands.",
  },
  {
    era: "Today",
    title: "Sixteen essentials",
    copy: "A short catalogue on purpose — leather, gold and dark acetate, re-cut each season, never overproduced.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      {/* ---------- Breadcrumb ---------- */}
      <nav aria-label="Breadcrumb" className="hairline-b bg-canvas">
        <div className="container-luxe flex items-center gap-3 py-3.5">
          <Link href="/" className="eyebrow text-smoke">
            Home
          </Link>
          <span aria-hidden="true" className="eyebrow text-stone">
            /
          </span>
          <span aria-current="page" className="eyebrow text-ink">
            About
          </span>
        </div>
      </nav>

      {/* ---------- Editorial header ---------- */}
      <section className="container-luxe pt-14 pb-10 sm:pt-20 sm:pb-12">
        <p className="eyebrow text-brass">Maison — N.03</p>
        <h1 className="display mt-3 max-w-2xl">
          Considered luxury, made to keep
        </h1>
        <p className="body-luxe mt-4 max-w-md">
          A small atelier with a long memory — sculpted leather, soft
          tailoring and polished accents, photographed in daylight and
          made for everyday ceremony.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link href="/shop" className="btn btn-primary">
            Shop the icons
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/shop" className="link-luxe text-sm">
            Browse the catalogue
          </Link>
        </div>
      </section>

      {/* ---------- Assurance strip ---------- */}
      <div className="hairline-t hairline-b bg-ivory">
        <div className="container-luxe grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {["Est. 1921", "Repaired for life", "Slow processes"].map(
            (item) => (
              <p
                key={item}
                className="eyebrow py-3.5 text-center text-smoke sm:px-4"
              >
                {item}
              </p>
            ),
          )}
        </div>
      </div>

      {/* ---------- 01 — Story split ---------- */}
      <section className="container-luxe section">
        <div className="editorial-grid items-start">
          <figure>
            <div className="img-frame">
              <Image
                src={editorialImage}
                alt="Clothing rail in a quiet atelier"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="eyebrow mt-3 text-stone">
              Atelier rail — Daylight, N.03
            </figcaption>
          </figure>
          <div className="max-w-md">
            <p className="eyebrow text-brass">01 — The maison</p>
            <h2 className="heading-section mt-3">
              A century of leather, kept in the family
            </h2>
            <div className="rule-double mt-6" aria-hidden="true" />
            <p className="body-luxe mt-6">
              Each silhouette begins on paper — a single line for the
              shoulder, a single curve for the handle. Seams are
              saddle-stitched, edges painted and polished, linings cut
              from breathable cotton twill.
            </p>
            <p className="body-luxe mt-4 text-sm">
              We keep the catalogue short on purpose. Sixteen quiet
              essentials, re-cut each season in grained calf leather,
              brass and dark acetate — sharp shapes with no excess
              hardware.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/new-arrivals" className="btn btn-secondary">
                New arrivals
              </Link>
              <Link href="/shop" className="link-luxe text-sm">
                Shop all pieces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 02 — Principles ---------- */}
      <section className="hairline-t bg-ivory">
        <div className="container-luxe section-tight">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow text-brass">02 — Principles</p>
              <h2 className="heading-section mt-3">
                Three rules on every bench
              </h2>
            </div>
            <Link href="/shop" className="link-luxe text-sm">
              See them in the pieces
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
            {principles.map((p) => (
              <div
                key={p.title}
                className="flex flex-col items-start gap-2 bg-canvas px-7 py-8 text-left"
              >
                <p.icon
                  className="h-5 w-5 text-forest"
                  aria-hidden="true"
                />
                <h3 className="eyebrow mt-3 text-ink">{p.title}</h3>
                <p className="text-sm leading-relaxed text-smoke">
                  {p.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 03 — Atelier banner ---------- */}
      <section className="relative isolate overflow-hidden bg-forest text-ivory">
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
          <p className="eyebrow text-gold">03 — Atelier, Est. 1921</p>
          <h2 className="display mt-4">
            Slow craft, repaired for life
          </h2>
          <p className="eyebrow mt-6 text-ivory/60">
            Tanning — Casting — Printing
          </p>
          <p className="body-luxe mx-auto mt-4 max-w-md text-ivory/80">
            Vegetable tanning, brass casting and silk printing under one
            roof. Two years guaranteed, mended whenever needed.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-light w-full sm:w-auto">
              Shop bestsellers
            </Link>
            <Link
              href="/new-arrivals"
              className="btn btn-outline-light w-full sm:w-auto"
            >
              What&apos;s new
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- 04 — Milestones ---------- */}
      <section className="container-luxe section">
        <div className="max-w-xl">
          <p className="eyebrow text-brass">04 — History</p>
          <h2 className="heading-section mt-3">Four dates, one line</h2>
          <p className="body-luxe mt-4 max-w-md text-sm">
            No reinventions, no noise — the same proportions, refined
            slowly over a century.
          </p>
        </div>
        <ol className="mt-10 divide-y divide-line border-y border-line">
          {milestones.map((m, i) => (
            <li
              key={m.era}
              className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[5rem_1fr_1.5fr] sm:items-baseline sm:gap-8"
            >
              <p className="eyebrow text-brass">{m.era}</p>
              <h3 className="font-display text-xl leading-snug">
                <span className="mr-3 text-sm text-stone">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {m.title}
              </h3>
              <p className="text-sm leading-relaxed text-smoke">{m.copy}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
          <p className="eyebrow text-smoke">
            Grained leather — Brass — Silk
          </p>
          <Link href="/shop" className="link-luxe text-sm">
            Explore the edit
          </Link>
        </div>
      </section>

      {/* ---------- Continue — forward only (breadcrumb already covers Home) ---------- */}
      <ContinueNav
        kicker="Continue — The catalogue"
        links={[
          { href: "/shop", label: "Shop the icons" },
          { href: "/new-arrivals", label: "New arrivals" },
        ]}
      />
    </main>
  );
}
