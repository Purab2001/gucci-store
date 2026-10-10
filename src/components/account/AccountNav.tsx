"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Account-area navigation. Horizontal scroll row on mobile, sticky
 * sidebar on desktop. Grows with future routes (orders, settings);
 * boutique links reuse the storefront destinations.
 */
export function AccountNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const overviewActive = pathname === "/account";

  return (
    <nav
      aria-label="Account"
      className="min-w-0 lg:sticky lg:top-8 lg:self-start"
    >
      <p className="eyebrow hidden text-stone lg:block">Account</p>
      <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 lg:mt-3 lg:flex-col lg:items-start lg:gap-3">
        <li>
          <Link
            href="/account"
            className="link-nav"
            data-active={overviewActive || undefined}
            aria-current={overviewActive ? "page" : undefined}
          >
            Overview
          </Link>
        </li>
        {role === "admin" && (
          <li>
            <Link href="/admin" className="link-nav">
              Atelier console
            </Link>
          </li>
        )}
      </ul>
      <p className="eyebrow mt-6 hidden text-stone lg:block">Boutique</p>
      <ul className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-2 lg:flex-col lg:items-start lg:gap-3">
        <li>
          <Link href="/shop" className="link-nav">
            Shop all
          </Link>
        </li>
        <li>
          <Link href="/new-arrivals" className="link-nav">
            New arrivals
          </Link>
        </li>
      </ul>
    </nav>
  );
}
