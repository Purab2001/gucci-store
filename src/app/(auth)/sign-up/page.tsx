import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account — Gucci Store",
  description: "Create your account.",
};

// Reads the session at request time (signed-in users bounce to /account).
// Blocking route: session read via headers() must run per request.
export const instant = false;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect("/account");

  const switchHref =
    callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//")
      ? `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`
      : "/sign-in";

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <AuthShell
        eyebrow="Account — N.02"
        title="Create your account"
        lede="One account for orders and preferences. No newsletters unless you ask — this version covers sign up, sign in and sign out only."
        callbackURL={callbackURL}
        switchCopy="Already have an account?"
        switchHref={switchHref}
        switchLabel="Sign in"
      >
        <AuthForm mode="sign-up" callbackURL={callbackURL} />
      </AuthShell>
    </main>
  );
}
