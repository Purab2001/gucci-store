import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth, type AuthUser, type Session } from "@/lib/auth";

export type Role = "user" | "admin";

/** Full Better Auth session (null when signed out/expired). */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Signed-in user or null. Server components/actions only. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

function isAdminRole(role: unknown): role is Role {
  return role === "admin";
}

/** Guard for customer routes. Redirects to sign-in with a callback URL. */
export async function requireUser(callbackURL = "/account"): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
  return user;
}

/**
 * Guard for admin routes and admin server actions.
 * Unauthenticated -> sign-in; authenticated non-admin -> 404
 * (deliberately hides the admin surface instead of a 403 page).
 */
export async function requireAdmin(
  callbackURL = "/admin",
): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
  if (!isAdminRole((user as { role?: unknown }).role)) notFound();
  return user;
}
