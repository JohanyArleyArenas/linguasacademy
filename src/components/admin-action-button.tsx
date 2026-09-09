"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminActionButton({
  url,
  method = "POST",
  body,
  label,
  pendingLabel,
  className,
  confirmMessage,
}: {
  url: string;
  method?: "POST" | "DELETE";
  body?: Record<string, unknown>;
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        "text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-60"
      }
    >
      {isPending ? (pendingLabel ?? "...") : label}
    </button>
  );
}
