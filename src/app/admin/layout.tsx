import { AdminNav } from "@/components/admin/AdminNav";
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
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-luxe section">
        <p className="eyebrow text-brass">Admin</p>
        <h1 className="display mt-3">Atelier console</h1>
        <p className="body-luxe mt-4 max-w-md text-sm">
          Signed in as {admin.email}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <AdminNav />
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </main>
  );
}
