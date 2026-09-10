"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

export function TeacherProfileForm({
  languages,
  specialties,
  initial,
}: {
  languages: Option[];
  specialties: Option[];
  initial: {
    headline: string;
    bio: string;
    videoUrl: string;
    pricePerHour: number;
    languageIds: string[];
    specialtyIds: string[];
  };
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [pricePerHour, setPricePerHour] = useState(initial.pricePerHour);
  const [languageIds, setLanguageIds] = useState<string[]>(initial.languageIds);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(initial.specialtyIds);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          videoUrl,
          pricePerHour,
          languageIds,
          specialtyIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.formErrors?.[0] ?? "No se pudo guardar el perfil.");
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Titular
        </label>
        <input
          required
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ej: Profesor certificado de inglés con 5 años de experiencia"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Biografía
        </label>
        <textarea
          required
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Video de presentación (URL, opcional)
        </label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Precio por hora (USD)
        </label>
        <input
          type="number"
          min={1}
          required
          value={pricePerHour}
          onChange={(e) => setPricePerHour(Number(e.target.value))}
          className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Idiomas que enseñas
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.id}
              onClick={() => toggle(languageIds, setLanguageIds, lang.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                languageIds.includes(lang.id)
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Especialidades
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {specialties.map((spec) => (
            <button
              type="button"
              key={spec.id}
              onClick={() => toggle(specialtyIds, setSpecialtyIds, spec.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                specialtyIds.includes(spec.id)
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600">
          Perfil guardado. Quedará pendiente de aprobación por el equipo de
          Lingua&apos;s Academy.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
