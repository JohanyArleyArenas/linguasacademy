"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function BookSlotButton({
  availabilityId,
  isStudent,
  isAuthed,
}: {
  availabilityId: string;
  isStudent: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (!isStudent) {
      setError("Solo los estudiantes pueden reservar clases.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo reservar este horario.");
        router.refresh();
        return;
      }

      router.push(`/checkout/${data.id}`);
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {isPending ? "Reservando..." : "Reservar"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
