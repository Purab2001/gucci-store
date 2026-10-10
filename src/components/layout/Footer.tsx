import Link from "next/link";
import { FooterClientNav } from "@/components/layout/FooterClientNav";

const catalogueLinks = [
  { href: "/shop", label: "Shop all pieces" },
  { href: "/new-arrivals", label: "New arrivals" },
  { href: "/about", label: "About the maison" },
];

const atelierNotes = [
  "Complimentary shipping, signature packaging",
  "30-day returns, always pressed",
  "Two-year guarantee, repaired for life",
];

export function Footer() {
  return (
    <footer className="hairline-t bg-ivory text-ink">
      <div className="container-luxe grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* ---------- Brand ---------- */}
        <div>
          <p className="eyebrow text-brass">Est. 1921</p>
          <p className="font-display mt-3 text-xl tracking-[0.18em] uppercase">
            Gucci Store
          </p>
          <p className="body-luxe mt-4 max-w-xs text-sm">
            Considered essentials in leather, gold and dark acetate —
            cut with restraint, kept for decades.
          </p>
        </div>

        {/* ---------- Catalogue ---------- */}
        <nav aria-label="Catalogue">
          <p className="eyebrow text-smoke">Catalogue</p>
          <ul className="mt-4 flex flex-col gap-3">
            {catalogueLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="link-luxe text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------- Client — "Your bag" is public; the rest is auth-aware ---------- */}
        <nav aria-label="Client">
          <p className="eyebrow text-smoke">Client</p>
          <ul className="mt-4 flex flex-col gap-3">
            <li>
              <Link href="/bag" className="link-luxe text-sm">
                Your bag
              </Link>
            </li>
            <FooterClientNav />
          </ul>
        </nav>

        {/* ---------- Atelier — service notes, not links ---------- */}
        <div>
          <p className="eyebrow text-smoke">Atelier</p>
          <ul className="mt-4 flex flex-col gap-3">
            {atelierNotes.map((note) => (
              <li key={note} className="text-sm leading-relaxed text-smoke">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Bottom bar ---------- */}
      <div className="hairline-t">
        <div className="container-luxe flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-smoke">
            © Gucci Store. All rights reserved.
          </p>
          <p className="eyebrow text-stone">
            Grained leather — Brass — Silk
          </p>
        </div>
      </div>
    </footer>
  );
}
