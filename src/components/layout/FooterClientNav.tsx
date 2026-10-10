"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/**
 * Auth-aware client island for the footer's Client column. Resolves the
 * session after hydration so the footer shell stays static/prerenderable
 * — same pattern as SessionNav in the header.
 */
export function FooterClientNav() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <li aria-hidden="true" className="text-sm text-stone">
        …
      </li>
    );
  }

  if (!session?.user) {
    return (
      <li>
        <Link href="/sign-in" className="link-luxe text-sm">
          Sign in
        </Link>
      </li>
    );
  }

  const role = (session.user as { role?: string }).role;
  return (
    <>
      <li>
        <Link href="/account" className="link-luxe text-sm">
          Your account
        </Link>
      </li>
      <li>
        <Link href="/account/orders" className="link-luxe text-sm">
          Order history
        </Link>
      </li>
      {role === "admin" && (
        <li>
          <Link href="/admin" className="link-luxe text-sm">
            Console
          </Link>
        </li>
      )}
    </>
  );
}
