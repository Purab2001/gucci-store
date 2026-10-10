"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  getBagAction,
  getBagCountAction,
  removeFromBagAction,
  updateBagQuantityAction,
} from "@/lib/cart-actions";
import { useGuestBag } from "@/components/bag/CartProvider";
import { EMPTY_BAG, type Bag, type BagItem } from "@/lib/cart-types";
import { formatCents } from "@/lib/format";

type LinePending = "dec" | "inc" | "remove" | null;

/**
 * Compact bag line for the header dropdown: packshot, name, quantity
 * stepper, line total, remove. Mutations are injected so the same row works
 * for the signed-in (server-action) bag and the guest (context) bag.
 */
function MiniBagLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: BagItem;
  onQuantity: (item: BagItem, next: number) => Promise<void>;
  onRemove: (item: BagItem) => Promise<void>;
}) {
  const [pending, setPending] = useState<LinePending>(null);

  async function run(kind: Exclude<LinePending, null>, fn: () => Promise<void>) {
    if (pending) return;
    setPending(kind);
    try {
      await fn();
    } finally {
      setPending(null);
    }
  }

  if (!item.available) {
    return (
      <li className="flex items-center gap-3 py-3">
        <div className="img-frame img-frame-square w-14 shrink-0">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
          <p className="eyebrow mt-0.5 text-smoke">No longer available</p>
        </div>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => run("remove", () => onRemove(item))}
          className="link-luxe shrink-0 text-xs disabled:opacity-40"
        >
          {pending === "remove" ? "Removing…" : "Remove"}
        </button>
      </li>
    );
  }

  const busy = pending !== null;
  const atCap = item.quantity >= item.stockQuantity;

  return (
    <li className="flex items-center gap-3 py-3">
      <Link
        href={`/shop/${item.slug}`}
        className="img-frame img-frame-square w-14 shrink-0"
        aria-label={item.name}
      >
        <Image
          src={item.image}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/shop/${item.slug}`}
          className="block truncate text-sm font-medium text-ink decoration-1 underline-offset-4 hover:underline"
        >
          {item.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-3">
          <div
            role="group"
            aria-label={`Quantity for ${item.name}`}
            className="flex items-center border border-line"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={busy}
              onClick={() => run("dec", () => onQuantity(item, item.quantity - 1))}
              className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-ivory disabled:opacity-40"
            >
              {pending === "dec" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            <span aria-live="polite" className="w-7 text-center text-xs tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || atCap}
              title={atCap ? `Only ${item.stockQuantity} available` : undefined}
              onClick={() => run("inc", () => onQuantity(item, item.quantity + 1))}
              className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-ivory disabled:opacity-40"
            >
              {pending === "inc" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-xs text-smoke">{formatCents(item.priceCents)} each</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-medium text-ink">
          {formatCents(item.priceCents * item.quantity)}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => run("remove", () => onRemove(item))}
          className="link-luxe text-xs disabled:opacity-40"
        >
          {pending === "remove" ? "Removing…" : "Remove"}
        </button>
      </div>
    </li>
  );
}

/**
 * Header bag dropdown. The trigger is a button (not a link): guests open
 * their bag without navigating or signing in. The panel closes on Escape
 * and on outside click, and returns focus to the trigger on Escape.
 */
export function BagMenu() {
  const { data: session, isPending: sessionPending } = useSession();
  const guest = useGuestBag();
  const [open, setOpen] = useState(false);
  const [serverBag, setServerBag] = useState<Bag | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverCount, setServerCount] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const signedIn = !sessionPending && !!session?.user;

  // Signed-in header count: fetched after hydration so the catalogue shell
  // stays static/prerenderable. Same pattern as SessionNav.
  useEffect(() => {
    if (sessionPending || !session?.user) return;
    let cancelled = false;
    async function load() {
      try {
        const next = await getBagCountAction();
        if (!cancelled) setServerCount(next);
      } catch {
        // Quietly keep the previous count; the bag page is authoritative.
      }
    }
    load();
    window.addEventListener("focus", load);
    window.addEventListener("bag:changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("bag:changed", load);
    };
  }, [sessionPending, session]);

  // Refresh the signed-in bag whenever the panel opens. State updates
  // happen only in the promise callbacks; the loading flag is armed in the
  // toggle handler below, never synchronously in this effect.
  useEffect(() => {
    if (!open || !signedIn) return;
    let cancelled = false;
    getBagAction().then(
      (next) => {
        if (!cancelled) {
          setServerBag(next);
          setServerCount(next.count);
          setServerLoading(false);
        }
      },
      () => {
        if (!cancelled) setServerLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, signedIn]);

  // Escape closes the panel and returns focus to the trigger; clicks
  // outside the trigger + panel close without stealing focus.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (
        target &&
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open ]);

  function close() {
    setOpen(false);
  }

  function toggle() {
    // Event handler, so arming the loading flag here is safe.
    if (!open && signedIn && serverBag === null) setServerLoading(true);
    setOpen(!open);
  }

  async function refreshServerBag() {
    try {
      const next = await getBagAction();
      setServerBag(next);
      setServerCount(next.count);
    } catch {
      // Keep the last good bag on transient failures.
    }
    window.dispatchEvent(new Event("bag:changed"));
  }

  async function handleQuantity(item: BagItem, next: number) {
    if (signedIn) {
      if (next < 1) {
        await removeFromBagAction(item.productId);
      } else {
        await updateBagQuantityAction(item.productId, next);
      }
      await refreshServerBag();
    } else {
      guest.setQuantity(item.slug, next);
    }
  }

  async function handleRemove(item: BagItem) {
    if (signedIn) {
      await removeFromBagAction(item.productId);
      await refreshServerBag();
    } else {
      guest.remove(item.slug);
    }
  }

  const bag: Bag = signedIn ? (serverBag ?? EMPTY_BAG) : guest.preview;
  const count = signedIn ? serverCount : bag.count;
  const loading = (signedIn && serverBag === null && serverLoading) || guest.previewPending;
  const unitWord = count === 1 ? "piece" : "pieces";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="bag-menu"
        aria-label={`Shopping bag, ${count} ${unitWord}`}
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center border border-line transition-colors hover:bg-ivory"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="eyebrow absolute -top-1.5 -right-1.5 border border-line bg-ink px-1.5 py-0.5 text-[0.625rem] text-ivory"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="bag-menu"
          role="dialog"
          aria-label="Shopping bag"
          className="surface-card absolute top-full right-0 z-50 mt-2 max-h-[80vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto px-5 py-4"
        >
          <p className="eyebrow text-brass">Bag</p>

          {loading && bag.items.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-sm text-smoke">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading your bag…
            </p>
          ) : bag.items.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-ink">Your bag is empty</p>
              <p className="mt-1 text-xs leading-relaxed text-smoke">
                Considered essentials, chosen slowly.
              </p>
              <Link href="/shop" onClick={close} className="btn btn-primary mt-4 w-full">
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <ul aria-label="Bag contents" className="divide-y divide-line">
                {bag.items.map((item) => (
                  <MiniBagLine
                    key={signedIn ? item.productId : item.slug}
                    item={item}
                    onQuantity={handleQuantity}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
              <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-line pt-3">
                <p className="eyebrow text-smoke">Subtotal</p>
                <p className="text-base font-medium text-ink">
                  {formatCents(bag.subtotalCents)}
                </p>
              </div>
              <Link href="/bag" onClick={close} className="btn btn-primary mt-4 w-full">
                View bag
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
