"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

export function WithdrawalForm({ balanceCents }: { balanceCents: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(balanceCents / 100);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/teacher/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(amount * 100) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo solicitar el retiro.");
        return;
      }
      router.refresh();
    });
  }

  if (balanceCents <= 0) {
    return (
      <p className="text-sm text-neutral-500">
        Aún no tienes saldo disponible para retirar.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-neutral-700">
          Monto a retirar
        </label>
        <input
          type="number"
          min={1}
          max={balanceCents / 100}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Solicitando..." : "Solicitar retiro"}
      </button>
      <span className="text-xs text-neutral-500">
        Saldo disponible: {formatPrice(balanceCents / 100)}
      </span>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
