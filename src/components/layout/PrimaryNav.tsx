"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // Catalogue family: collections live under Shop.
  if (href === "/shop") {
    return (
      pathname === "/shop" ||
      pathname.startsWith("/shop/") ||
      pathname === "/collections" ||
      pathname.startsWith("/collections/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Client island for the primary nav. Reads the pathname after hydration
 * so the header shell (and root layout) stays static/prerenderable —
 * same pattern as SessionNav.
 */
export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="link-nav"
            data-active={active || undefined}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
