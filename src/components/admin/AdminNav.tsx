"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Admin-area navigation. Horizontal scroll row on mobile, sticky
 * sidebar on desktop — mirrors AccountNav so the console feels like
 * the same maison. Display only: every admin route and server action
 * still verifies the admin role server-side via requireAdmin().
 */
export function AdminNav() {
  const pathname = usePathname() ?? "";
  const overviewActive = pathname === "/admin";
  const productsActive = pathname.startsWith("/admin/products");
  const categoriesActive = pathname.startsWith("/admin/categories");
  const ordersActive = pathname.startsWith("/admin/orders");

  return (
    <nav
      aria-label="Admin"
      className="min-w-0 lg:sticky lg:top-8 lg:self-start"
    >
      <p className="eyebrow hidden text-stone lg:block">Atelier console</p>
      <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 lg:mt-3 lg:flex-col lg:items-start lg:gap-3">
        <li>
          <Link
            href="/admin"
            className="link-nav"
            data-active={overviewActive || undefined}
            aria-current={overviewActive ? "page" : undefined}
          >
            Overview
          </Link>
        </li>
        <li>
          <Link
            href="/admin/products"
            className="link-nav"
            data-active={productsActive || undefined}
            aria-current={productsActive ? "page" : undefined}
          >
            Products
          </Link>
        </li>
        <li>
          <Link
            href="/admin/categories"
            className="link-nav"
            data-active={categoriesActive || undefined}
            aria-current={categoriesActive ? "page" : undefined}
          >
            Categories
          </Link>
        </li>
        <li>
          <Link
            href="/admin/orders"
            className="link-nav"
            data-active={ordersActive || undefined}
            aria-current={ordersActive ? "page" : undefined}
          >
            Orders
          </Link>
        </li>
      </ul>
      <p className="eyebrow mt-6 hidden text-stone lg:block">Boutique</p>
      <ul className="mt-3 hidden flex-wrap items-center gap-x-7 gap-y-2 lg:flex lg:flex-col lg:items-start lg:gap-3">
        <li>
          <Link href="/shop" className="link-nav">
            View storefront
          </Link>
        </li>
        <li>
          <Link href="/account" className="link-nav">
            Back to account
          </Link>
        </li>
      </ul>
    </nav>
  );
}
