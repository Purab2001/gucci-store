import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in — Gucci Store",
  description: "Sign in to your account.",
};

// Reads the session at request time (signed-in users bounce to /account).
// Blocking route: session read via headers() must run per request.
export const instant = false;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect("/account");

  const switchHref =
    callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//")
      ? `/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`
      : "/sign-up";

  return (
    <main className="flex flex-1 flex-col bg-canvas text-ink">
      <AuthShell
        eyebrow="Account — N.01"
        title="Welcome back"
        lede="Sign in to view your account. Sessions stay active for 7 days on this device."
        callbackURL={callbackURL}
        switchCopy="New here?"
        switchHref={switchHref}
        switchLabel="Create an account"
      >
        <AuthForm mode="sign-in" callbackURL={callbackURL} />
      </AuthShell>
    </main>
  );
}
