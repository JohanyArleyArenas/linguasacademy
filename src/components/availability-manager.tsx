"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";

type Slot = { id: string; startsAt: string; endsAt: string; isBooked: boolean };

export function AvailabilityManager({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Elige una fecha.");
      return;
    }
    const startsAt = new Date(`${date}T${startTime}:00`);
    const endsAt = new Date(startsAt.getTime() + duration * 60000);

    startTransition(async () => {
      const res = await fetch("/api/teacher/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo agregar el horario.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/teacher/availability/${id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div>
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Fecha
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Hora de inicio
          </label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Duración (min)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Agregar horario
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3"
          >
            <span className="text-sm text-neutral-700">
              {formatDateTime(new Date(slot.startsAt))}
              {slot.isBooked && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  Reservado
                </span>
              )}
            </span>
            {!slot.isBooked && (
              <button
                onClick={() => handleDelete(slot.id)}
                disabled={isPending}
                className="text-xs font-medium text-red-600 hover:text-red-500"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
        {slots.length === 0 && (
          <p className="text-sm text-neutral-500">
            No tienes horarios próximos. Agrega uno arriba.
          </p>
        )}
      </div>
    </div>
  );
}
