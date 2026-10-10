import Link from "next/link";
import { BagMenu } from "@/components/bag/BagMenu";
import { PrimaryNav } from "@/components/layout/PrimaryNav";
import { SessionNav } from "@/components/layout/SessionNav";

export function Header() {
  return (
    <header className="hairline-b bg-canvas text-ink">
      <div className="container-luxe flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.18em] uppercase">
          Gucci Store
        </Link>
        <PrimaryNav />
        <div className="flex items-center gap-5">
          <SessionNav />
          <span aria-hidden="true" className="h-5 w-px bg-line" />
          <BagMenu />
        </div>
      </div>
    </header>
  );
}
