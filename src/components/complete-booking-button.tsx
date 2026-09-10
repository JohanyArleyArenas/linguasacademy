"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function CompleteBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-emerald-600 hover:text-emerald-500 disabled:opacity-60"
    >
      {isPending ? "Marcando..." : "Marcar clase como impartida"}
    </button>
  );
}
