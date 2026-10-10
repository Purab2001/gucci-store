import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/session";

// Auth gate reads the session at request time, so this segment cannot
// prerender into the static shell — it blocks on the server instead.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single gate for the whole subtree: unauthenticated -> sign-in,
  // authenticated non-admin -> 404. Every nested page re-checks via
  // requireAdmin() (defense in depth) and every admin server action
  // must start with requireAdmin() — the proxy cookie check alone
  // is optimistic and never authorizes.
  const admin = await requireAdmin("/admin");

  return (
    <div className="flex flex-1 flex-col bg-canvas text-ink lg:flex-row">
      <AdminSidebar email={admin.email} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
