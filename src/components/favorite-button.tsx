"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({
  teacherId,
  initialFavorited,
  isAuthed,
}: {
  teacherId: string;
  initialFavorited: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`rounded-md border px-3 py-2 text-sm font-medium ${
        favorited
          ? "border-rose-300 bg-rose-50 text-rose-700"
          : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {favorited ? "♥ En favoritos" : "♡ Guardar en favoritos"}
    </button>
  );
}
