"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ContactTeacherButton({
  teacherId,
  isAuthed,
  isOwnProfile,
}: {
  teacherId: string;
  isAuthed: boolean;
  isOwnProfile: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) return null;

  function handleClick() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "No se pudo abrir la conversación.");
        return;
      }

      router.push(`/dashboard/messages/${data.id}`);
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
      >
        {isPending ? "Abriendo..." : "Enviar mensaje"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
