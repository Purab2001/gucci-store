import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic auth check only — redirects obvious logged-out visits early.
 * Real authorization always happens server-side in layouts/helpers
 * (requireUser/requireAdmin), which validate the session against the DB.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // /bag is deliberately public: guests browse a localStorage bag and the
  // page resolves live prices server-side. Only /account and /admin gate here.
  const protectedPath =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");
  if (!protectedPath) return NextResponse.next();

  // Only the real session cookie passes the optimistic gate. A generic
  // `better-auth.*` prefix check is spoofable (anyone can set a cookie).
  // Real authorization still happens server-side via requireUser/requireAdmin.
  const hasSessionCookie = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name === "better-auth.session_token" ||
        c.name === "__Secure-better-auth.session_token",
    );
  if (hasSessionCookie) return NextResponse.next();

  const signIn = request.nextUrl.clone();
  signIn.pathname = "/sign-in";
  signIn.searchParams.set("callbackURL", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Deliberately narrow: /api/** (incl. /api/auth) is never matched.
  matcher: ["/account/:path*", "/admin/:path*"],
};
