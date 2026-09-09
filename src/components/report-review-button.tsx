"use client";

import { useState, useTransition } from "react";

export function ReportReviewButton({
  reviewId,
  isAuthed,
}: {
  reviewId: string;
  isAuthed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isAuthed) return null;

  if (done) {
    return <p className="mt-2 text-xs text-neutral-500">Reporte enviado. Gracias.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-neutral-400 hover:text-neutral-600"
      >
        Reportar reseña
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reason }),
      });
      if (res.ok) setDone(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <textarea
        required
        minLength={5}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="¿Por qué reportas esta reseña?"
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
        rows={2}
      />
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Enviar reporte"}
      </button>
    </form>
  );
}
