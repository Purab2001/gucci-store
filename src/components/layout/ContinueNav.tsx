import Link from "next/link";

export type ContinueNavLink = {
  href: string;
  label: string;
  /** Editorial underline by default; tracked nav style for emphasis. */
  variant?: "luxe" | "nav";
};

type ContinueNavProps = {
  /** Left-hand kicker, e.g. "Continue — The catalogue". */
  kicker: string;
  /** Forward-only links — never repeat the page's breadcrumb trail. */
  links: ContinueNavLink[];
};

/**
 * Shared pre-footer strip. Breadcrumbs (top) handle backward wayfinding;
 * this handles forward motion only, so the same Home/Shop links never
 * appear twice on one page.
 */
export function ContinueNav({ kicker, links }: ContinueNavProps) {
  return (
    <div className="hairline-t bg-canvas">
      <div className="container-luxe flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow text-smoke">{kicker}</p>
        <nav
          aria-label="Continue"
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          {links.map((link) =>
            link.variant === "nav" ? (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="link-nav"
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="link-luxe text-sm"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
