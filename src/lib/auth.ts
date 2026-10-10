import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

// Server-only auth instance. Import only in server code (RSC,
// Server Actions, Route Handlers). Client components use auth-client.ts.
export const auth = betterAuth({
  // Explicit secret (also readable from BETTER_AUTH_SECRET env): fails fast
  // with a clear message instead of a cryptic session-cookie failure.
  secret: process.env.BETTER_AUTH_SECRET,
  // The app origin is the only trusted origin for callbacks/redirects.
  // BETTER_AUTH_URL env covers the base URL; this pins CSRF validation to
  // the configured app origin when set.
  trustedOrigins:
    process.env.NEXT_PUBLIC_APP_URL != null
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : undefined,
  // Rate limiting is on by default in production; keep it explicit with
  // tighter windows on the credential endpoints (brute-force targets).
  // Default storage is used deliberately: the "database" option needs a
  // rateLimit table + migration — adopt it when the app runs on
  // multi-instance serverless where per-instance memory resets matter.
  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  // Persistent sessions: 7-day expiry with daily sliding refresh.
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      // Customer by default; promoted to "admin" via SQL (see README/plan).
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
