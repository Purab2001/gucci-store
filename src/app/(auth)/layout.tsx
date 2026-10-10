import Link from "next/link";

/**
 * Bare auth shell for sign-in/sign-up. Sign-in is a gate, not browsing,
 * so these routes get a small wordmark plus a way back — never the
 * storefront header, bag state, or footer.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-canvas text-ink">
      <div className="container-luxe flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-display text-lg tracking-[0.18em] uppercase"
        >
          Gucci Store
        </Link>
        <Link href="/" className="link-nav">
          Back to shop
        </Link>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
