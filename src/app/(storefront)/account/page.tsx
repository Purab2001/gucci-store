import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account — Gucci Store",
  description: "View your account.",
};

// Reads the session at request time — per-customer and live, so this
// route blocks on the server instead of prerendering.
export const instant = false;

export default async function AccountPage() {
  // Layout already gates this route; re-read here so the profile
  // renders from a server-authorized session (defense in depth).
  const user = await requireUser("/account");
  const role = (user as { role?: string }).role ?? "user";

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="account-profile-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Profile</p>
        <h2 id="account-profile-heading" className="heading-sub mt-3">
          Account information
        </h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Name</dt>
            <dd className="text-right text-sm text-ink">{user.name}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Email</dt>
            <dd className="text-right text-sm break-all text-ink">
              {user.email}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Member since</dt>
            <dd className="text-right text-sm text-ink">
              {formatDate(user.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="account-session-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Session & security</p>
        <h2 id="account-session-heading" className="heading-sub mt-3">
          How you sign in
        </h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">Method</dt>
            <dd className="text-right text-sm text-ink">Email & password</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="eyebrow shrink-0 text-smoke">This device</dt>
            <dd className="text-right text-sm text-ink">
              Session stays active for 7 days
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-stone">
          Signing out ends the session on this device only.
        </p>
      </section>

      {role === "admin" && (
        <section
          aria-labelledby="account-atelier-heading"
          className="border border-line bg-ivory px-7 py-8 sm:px-9"
        >
          <p className="eyebrow text-brass">Atelier</p>
          <h2 id="account-atelier-heading" className="heading-sub mt-3">
            Console access
          </h2>
          <p className="body-luxe mt-3 max-w-md text-sm">
            Your account carries the admin role, checked server-side on
            every read.
          </p>
          <Link href="/admin" className="btn btn-secondary mt-6">
            Open console
          </Link>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
