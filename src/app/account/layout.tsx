import { AccountNav } from "@/components/account/AccountNav";
import { requireUser } from "@/lib/session";

// Auth gate reads the session at request time, so this segment cannot
// prerender into the static shell — it blocks on the server instead.
export const instant = false;

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/account");
  const role = (user as { role?: string }).role ?? "user";
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <section className="container-luxe section">
        <p className="eyebrow text-brass">Account</p>
        <h1 className="display mt-3">Hello, {firstName}</h1>
        <p className="body-luxe mt-4 max-w-md text-sm">
          Signed in as {user.email}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <AccountNav role={role} />
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </main>
  );
}
