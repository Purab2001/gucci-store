import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin — Gucci Store",
  description: "Admin area.",
};

export default async function AdminPage() {
  // Route is already gated by AdminLayout; re-check here so this
  // server read is itself authorized (defense in depth for the action).
  const admin = await requireAdmin("/admin");

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(user);
  const totalUsers = Number(rows[0]?.count ?? 0);

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-narrow section">
        <p className="eyebrow text-brass">Admin</p>
        <h1 className="display mt-3">Atelier console</h1>
        <p className="body-luxe mt-4 max-w-md text-sm">
          Signed in as {admin.email}. This area and its data reads are
          restricted to the admin role, checked server-side.
        </p>
        <dl className="mt-8 divide-y divide-line border-y border-line">
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Total users</dt>
            <dd className="text-right text-sm text-ink">{totalUsers}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Your role</dt>
            <dd className="text-right text-sm text-ink">admin</dd>
          </div>
        </dl>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
