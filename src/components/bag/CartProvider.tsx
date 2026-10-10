"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getGuestBagPreviewAction,
  type GuestBagEntry,
} from "@/lib/cart-actions";
import {
  MAX_GUEST_LINES as MAX_LINES,
  MAX_GUEST_QUANTITY as MAX_QUANTITY,
  sanitizeGuestEntries as sanitize,
} from "@/lib/guest-bag";
import { EMPTY_BAG, type Bag } from "@/lib/cart-types";

const STORAGE_KEY = "gucci-store:guest-bag:v1";
const GUEST_BAG_EVENT = "gucci-store:guest-bag:change";

interface GuestBagContextValue {
  /** Raw slug + quantity entries as persisted to localStorage. */
  entries: GuestBagEntry[];
  /** Entries resolved against live catalogue prices (server truth). */
  preview: Bag;
  previewPending: boolean;
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
}

const GuestBagContext = createContext<GuestBagContextValue | null>(null);

const EMPTY_ENTRIES: GuestBagEntry[] = [];

// Cache the parsed cart by its raw localStorage string so getSnapshot
// returns a stable reference while nothing changed. Without this,
// a fresh array on every call would loop React's store check forever.
let lastRaw: string | null | undefined;
let lastParsed: GuestBagEntry[] = EMPTY_ENTRIES;

function getSnapshot(): GuestBagEntry[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === lastRaw) return lastParsed;
  lastRaw = raw;
  if (!raw) {
    lastParsed = EMPTY_ENTRIES;
    return lastParsed;
  }
  try {
    const parsed = sanitize(JSON.parse(raw));
    lastParsed = parsed.length === 0 ? EMPTY_ENTRIES : parsed;
  } catch {
    lastParsed = EMPTY_ENTRIES;
  }
  return lastParsed;
}

function getServerSnapshot(): GuestBagEntry[] {
  return EMPTY_ENTRIES;
}

function subscribe(onChange: () => void): () => void {
  function onStorage(e: StorageEvent) {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(GUEST_BAG_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(GUEST_BAG_EVENT, onChange);
  };
}

function writeStored(next: GuestBagEntry[]): void {
  try {
    if (next.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Storage unavailable — the in-memory read still returns the last
    // parsed value; the change simply won't persist.
  }
  try {
    window.dispatchEvent(new Event(GUEST_BAG_EVENT));
  } catch {
    // Non-DOM environment — subscribers will pick it up via storage event.
  }
}

/**
 * Client-side guest bag. Persists slug + quantity pairs to localStorage
 * (never prices); live money/stock always comes from the preview server
 * action. Wraps the header and page content in the root layout so one state
 * drives both the dropdown and the /bag page.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  // External store: SSR uses getServerSnapshot (empty), the client hydrates
  // from localStorage via getSnapshot. No mount effect needed.
  const entries = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  // Last resolved preview with the entry key it was resolved for. Both the
  // preview and its pending flag derive from this — no synchronous setState
  // inside effects, and the previous preview stays visible while refreshing.
  const [resolved, setResolved] = useState<{ key: string; bag: Bag } | null>(
    null,
  );

  // Resolve live prices/stock for the current entries. State updates
  // happen only in the promise callbacks, never synchronously in the body.
  useEffect(() => {
    if (entries.length === 0) return;
    const key = JSON.stringify(entries);
    let cancelled = false;
    getGuestBagPreviewAction(entries).then(
      (next) => {
        if (!cancelled) setResolved({ key, bag: next });
      },
      () => {
        // Keep the last good preview; the bag page is authoritative.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entries]);

  const add = useCallback((slug: string, quantity = 1) => {
    if (typeof slug !== "string" || slug.length < 1) return;
    const n = Math.floor(quantity);
    if (!Number.isFinite(n) || n < 1) return;
    const prev = getSnapshot();
    const existing = prev.find((e) => e.slug === slug);
    let next: GuestBagEntry[];
    if (existing) {
      next = prev.map((e) =>
        e.slug === slug
          ? { ...e, quantity: Math.min(e.quantity + n, MAX_QUANTITY) }
          : e,
      );
    } else {
      if (prev.length >= MAX_LINES) return;
      next = [...prev, { slug, quantity: Math.min(n, MAX_QUANTITY) }];
    }
    writeStored(next);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const n = Math.floor(quantity);
    if (!Number.isFinite(n)) return;
    const prev = getSnapshot();
    let next: GuestBagEntry[];
    if (n < 1) {
      next = prev.filter((e) => e.slug !== slug);
    } else {
      next = prev.map((e) =>
        e.slug === slug
          ? { ...e, quantity: Math.min(n, MAX_QUANTITY) }
          : e,
      );
    }
    writeStored(next);
  }, []);

  const remove = useCallback((slug: string) => {
    const prev = getSnapshot();
    writeStored(prev.filter((e) => e.slug !== slug));
  }, []);

  const value = useMemo<GuestBagContextValue>(() => {
    const key = JSON.stringify(entries);
    const current = resolved?.key === key ? resolved.bag : null;
    return {
      entries,
      preview: entries.length === 0 ? EMPTY_BAG : (current ?? resolved?.bag ?? EMPTY_BAG),
      previewPending: entries.length > 0 && current === null,
      add,
      setQuantity,
      remove,
    };
  }, [entries, resolved, add, setQuantity, remove]);

  return (
    <GuestBagContext.Provider value={value}>
      {children}
    </GuestBagContext.Provider>
  );
}

export function useGuestBag(): GuestBagContextValue {
  const ctx = useContext(GuestBagContext);
  if (!ctx) throw new Error("useGuestBag must be used inside CartProvider.");
  return ctx;
}
