"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

const REFRESH_INTERVAL_MS = 3000;
const MAX_REFRESHES = 5;

/**
 * Live loading state for the payment-confirming receipt. Revalidates the
 * server receipt a few times via `router.refresh()` — the page flips to the
 * paid receipt on its own once the webhook lands — then settles into a
 * static prompt instead of polling forever.
 */
export function PendingOrderRefresh() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const settled = attempts >= MAX_REFRESHES;

  useEffect(() => {
    if (settled) return;
    const timer = window.setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, settled, router]);

  return (
    <p role="status" className="mt-6 flex items-center gap-2 text-sm text-smoke">
      {!settled && (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {settled
        ? "Still confirming — refresh the page in a moment."
        : "Checking payment status…"}
    </p>
  );
}
