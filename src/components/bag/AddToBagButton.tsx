"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { addToBagAction, getGuestBagPreviewAction } from "@/lib/cart-actions";
import { useSession } from "@/lib/auth-client";
import { useGuestBag } from "@/components/bag/CartProvider";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "added"; notice: string | null }
  | { kind: "error"; message: string };

/**
 * Adds the piece to the signed-in (server) bag or the guest (localStorage)
 * bag. Guests are never bounced to sign-in: the shared cart context updates
 * the header dropdown immediately.
 */
export function AddToBagButton({
  slug,
  outOfStock,
}: {
  slug: string;
  outOfStock: boolean;
}) {
  const { data: session, isPending: sessionPending } = useSession();
  const guest = useGuestBag();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (outOfStock) {
    return (
      <button type="button" disabled className="btn btn-primary w-full">
        Unavailable
      </button>
    );
  }

  async function onClick() {
    if (status.kind === "pending") return;
    // Session still resolving: hold the button rather than misrouting the add.
    if (sessionPending) return;
    if (!session?.user) {
      // Guest bag lives in localStorage, so verify against live catalogue
      // before claiming success — same stock gate the server bag enforces.
      // Preview is authoritative for price/stock; localStorage holds identity only.
      setStatus({ kind: "pending" });
      try {
        const existing =
          guest.entries.find((e) => e.slug === slug)?.quantity ?? 0;
        const preview = await getGuestBagPreviewAction([
          { slug, quantity: existing + 1 },
        ]);
        const line = preview.items.find((item) => item.slug === slug);
        if (!line || !line.available) {
          setStatus({
            kind: "error",
            message: "This piece is out of stock.",
          });
          return;
        }
        guest.add(slug, 1);
        setStatus({
          kind: "added",
          notice:
            line.quantity < existing + 1
              ? `Only ${line.stockQuantity} available — quantity adjusted.`
              : null,
        });
      } catch {
        // Preview failed (offline?): still add optimistically; the bag page
        // preview remains authoritative and will mark unavailable lines there.
        guest.add(slug, 1);
        setStatus({ kind: "added", notice: null });
      }
      return;
    }
    setStatus({ kind: "pending" });
    try {
      const result = await addToBagAction(slug, 1, `/shop/${slug}`);
      if (!result.ok) {
        setStatus({ kind: "error", message: result.message });
        return;
      }
      window.dispatchEvent(new Event("bag:changed"));
      setStatus({
        kind: "added",
        notice:
          result.clamped && result.available !== null
            ? `Only ${result.available} available — quantity adjusted.`
            : null,
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={status.kind === "pending" || sessionPending}
        className="btn btn-primary w-full"
      >
        {status.kind === "pending" ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Adding…
          </>
        ) : status.kind === "added" ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Added to bag
          </>
        ) : (
          "Add to bag"
        )}
      </button>
      {status.kind === "added" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm"
        >
          <span className="text-smoke">
            {status.notice ?? "In your bag."}
          </span>
          <Link href="/bag" className="link-luxe text-ink">
            View bag
          </Link>
        </div>
      )}
      {status.kind === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 border border-heritage/30 bg-ivory px-4 py-3 text-sm leading-relaxed text-heritage"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {status.message}
        </p>
      )}
    </div>
  );
}
