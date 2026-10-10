"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/**
 * Client island for the header. Fetches the session after hydration so the
 * catalogue shell (and root layout) stays static/prerenderable.
 */
export function SessionNav() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <span aria-hidden="true" className="link-nav opacity-40">
        …
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link href="/sign-in" className="link-nav">
        Sign in
      </Link>
    );
  }

  const role = (session.user as { role?: string }).role;
  return (
    <span className="flex items-center gap-6">
      {role === "admin" && (
        <Link href="/admin" className="link-nav">
          Admin
        </Link>
      )}
      <Link href="/account" className="link-nav">
        Account
      </Link>
    </span>
  );
}
