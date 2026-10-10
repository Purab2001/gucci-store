import Link from "next/link";
import { BagMenu } from "@/components/bag/BagCount";
import { SessionNav } from "@/components/layout/SessionNav";

export function Header() {
  return (
    <header className="hairline-b bg-canvas text-ink">
      <div className="container-luxe flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.18em] uppercase">
          Gucci Store
        </Link>
        <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary">
          <Link href="/" className="link-nav" data-active="true">
            Home
          </Link>
          <Link href="/shop" className="link-nav">
            Shop
          </Link>
          <Link href="/new-arrivals" className="link-nav">
            New Arrivals
          </Link>
          <span className="link-nav cursor-not-allowed opacity-40">About</span>
        </nav>
        <div className="flex items-center gap-5">
          <SessionNav />
          <span aria-hidden="true" className="h-5 w-px bg-line" />
          <BagMenu />
        </div>
      </div>
    </header>
  );
}
