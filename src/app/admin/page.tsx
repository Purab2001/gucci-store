import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin — Gucci Store",
  description: "Admin area.",
};

// Reads the session at request time — admin-only and live, so this
// route blocks on the server instead of prerendering.
export const instant = false;

const SECTIONS = [
  {
    href: "/admin/products",
    eyebrow: "Catalogue",
    title: "Products",
    body: "View, create and edit pieces. Stock is updated from the product list.",
  },
  {
    href: "/admin/categories",
    eyebrow: "Catalogue",
    title: "Categories",
    body: "Manage the families the storefront filters and collections use.",
  },
  {
    href: "/admin/orders",
    eyebrow: "Fulfilment",
    title: "Orders",
    body: "View every checkout attempt. Status is owned by the Stripe webhook — read-only here.",
  },
] as const;

export default async function AdminPage() {
  // Layout already gates this route; re-check here so this
  // server read is itself authorized (defense in depth).
  await requireAdmin("/admin");

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="admin-overview-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Overview</p>
        <h2 id="admin-overview-heading" className="heading-sub mt-3">
          What needs the atelier?
        </h2>
        <p className="body-luxe mt-3 max-w-md text-sm">
          Three focused areas for v1 — products (including stock),
          categories and orders. No dashboards, no analytics.
        </p>
      </section>

      <ul aria-label="Admin sections" className="grid grid-cols-1 gap-6">
        {SECTIONS.map((section) => (
          <li
            key={section.href}
            className="surface-card px-7 py-8 sm:px-9"
          >
            <p className="eyebrow text-brass">{section.eyebrow}</p>
            <h3 className="heading-sub mt-3">{section.title}</h3>
            <p className="body-luxe mt-3 max-w-md text-sm">{section.body}</p>
            <Link href={section.href} className="btn btn-secondary mt-6">
              Open {section.title.toLowerCase()}
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
