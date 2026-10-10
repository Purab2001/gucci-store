import { requireAdmin } from "@/lib/session";

// Auth gate reads the session at request time, so this segment cannot
// prerender into the static shell — it blocks on the server instead.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");
  return children;
}
