import Link from "next/link";
import { RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const assurances = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    copy: "Sessions last 7 days on this device only.",
  },
  {
    icon: Truck,
    title: "Complimentary shipping",
    copy: "Signature packaging on every order.",
  },
  {
    icon: RefreshCcw,
    title: "Effortless returns",
    copy: "Within 30 days, always pressed.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  lede,
  callbackURL,
  switchCopy,
  switchHref,
  switchLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  callbackURL?: string | null;
  switchCopy: string;
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  const continuing =
    callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//") && callbackURL !== "/account";

  return (
    <section className="container-luxe section">
      <div className="editorial-grid lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow text-brass">{eyebrow}</p>
          <h1 className="display mt-3">{title}</h1>
          <p className="body-luxe mt-4 max-w-md text-sm">{lede}</p>
          {continuing && (
            <p className="eyebrow mt-5 inline-block border border-line bg-ivory px-3 py-2 text-smoke">
              You&apos;ll continue to {callbackURL} after signing in
            </p>
          )}
          <div className="surface-card mt-8 px-7 py-8 sm:px-9">{children}</div>
          <p className="mt-6 text-sm text-smoke">
            {switchCopy}{" "}
            <Link href={switchHref} className="link-luxe text-ink">
              {switchLabel}
            </Link>
            <span aria-hidden="true" className="mx-3 text-line">
              |
            </span>
            <Link href="/" className="link-luxe">
              Back to home
            </Link>
          </p>
        </div>

        <aside className="border border-line bg-ivory px-7 py-8 sm:px-9" aria-label="Why create an account">
          <p className="eyebrow text-brass">The house promise</p>
          <h2 className="heading-sub mt-3">One account, quietly kept</h2>
          <div className="rule-double mt-6" aria-hidden="true" />
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {assurances.map((a) => (
              <div key={a.title} className="flex items-start gap-4 py-4">
                <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
                <div>
                  <dt className="eyebrow text-ink">{a.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-smoke">{a.copy}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-stone">
            No newsletters unless you ask — this version covers sign up, sign in
            and sign out only.
          </p>
        </aside>
      </div>
    </section>
  );
}
