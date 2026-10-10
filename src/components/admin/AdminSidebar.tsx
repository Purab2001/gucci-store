"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

/**
 * Admin sidebar navigation. Four console sections pinned at the top,
 * storefront/account/sign-out utilities plus the signed-in email caption
 * pinned at the bottom. Horizontal rows on mobile, fixed vertical sidebar
 * on desktop. Display only: every admin route and server action still
 * verifies the admin role server-side via requireAdmin().
 */
export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname() ?? "";
  const overviewActive = pathname === "/admin";
  const productsActive = pathname.startsWith("/admin/products");
  const categoriesActive = pathname.startsWith("/admin/categories");
  const ordersActive = pathname.startsWith("/admin/orders");

  return (
    <aside
      aria-label="Admin console"
      className="border-b border-line bg-canvas lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <div className="flex flex-col gap-6 px-5 py-6 sm:px-8 lg:gap-10 lg:px-8 lg:py-10">
        <div>
          <p className="eyebrow text-brass">Atelier console</p>
          <p className="font-display mt-2 text-lg tracking-[0.18em] uppercase">
            Admin
          </p>
        </div>

        <nav aria-label="Console sections">
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 lg:flex-col lg:items-start lg:gap-3">
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
        </nav>

        <div className="border-t border-line pt-5 lg:mt-auto">
          <p className="text-xs break-all text-stone">
            Signed in as {email}
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 lg:flex-col lg:items-start lg:gap-3">
            <li>
              <Link href="/" className="link-nav">
                View storefront
              </Link>
            </li>
            <li>
              <Link href="/account" className="link-nav">
                Account
              </Link>
            </li>
            <li className="w-full lg:pt-2">
              <SignOutButton />
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
