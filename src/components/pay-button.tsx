"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PayButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/payments/${bookingId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo procesar el pago.");
        return;
      }
      router.push("/dashboard/student");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={isPending}
        className="w-full rounded-md bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "Procesando pago..." : "Pagar ahora (simulado)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
