import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
    take: 12,
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Aprende un idioma con profesores nativos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Encuentra al profesor ideal, reserva una clase y aprende a tu
            ritmo, desde cualquier lugar.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/teachers"
              className="rounded-md bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500"
            >
              Buscar profesor
            </Link>
            <Link
              href="/register?role=TEACHER"
              className="rounded-md border border-neutral-300 bg-white px-5 py-3 font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Enseña en LinguasAcademy
            </Link>
          </div>
        </div>
      </section>

      {languages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            Idiomas populares
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {languages.map((lang) => (
              <Link
                key={lang.id}
                href={`/teachers?language=${lang.code}`}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:border-indigo-300 hover:text-indigo-700"
              >
                {lang.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-neutral-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            Cómo funciona
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "1. Encuentra un profesor",
                body: "Filtra por idioma, precio y disponibilidad.",
              },
              {
                title: "2. Reserva una clase",
                body: "Elige un horario disponible y confirma tu reserva.",
              },
              {
                title: "3. Aprende y valora",
                body: "Toma tu clase y deja una reseña para otros estudiantes.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200"
              >
                <h3 className="font-medium text-neutral-900">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
