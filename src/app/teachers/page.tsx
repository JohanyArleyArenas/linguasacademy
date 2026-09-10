import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export default async function TeachersPage({
  searchParams,
}: PageProps<"/teachers">) {
  const params = await searchParams;
  const languageCode = typeof params.language === "string" ? params.language : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined;
  const specialtyId = typeof params.specialty === "string" ? params.specialty : undefined;

  const where: Prisma.TeacherProfileWhereInput = {
    status: "APPROVED",
    ...(languageCode
      ? { languages: { some: { language: { code: languageCode } } } }
      : {}),
    ...(specialtyId ? { specialties: { some: { specialtyId } } } : {}),
    ...(maxPrice ? { pricePerHour: { lte: maxPrice } } : {}),
  };

  const [teachers, languages, specialties] = await Promise.all([
    prisma.teacherProfile.findMany({
      where,
      include: {
        user: true,
        languages: { include: { language: true } },
        specialties: { include: { specialty: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.language.findMany({ orderBy: { name: "asc" } }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Encuentra tu profesor
      </h1>

      <form className="mt-6 flex flex-wrap gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <select
          name="language"
          defaultValue={languageCode ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los idiomas</option>
          {languages.map((l) => (
            <option key={l.id} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          name="specialty"
          defaultValue={specialtyId ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Cualquier especialidad</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="maxPrice"
          placeholder="Precio máx. por hora"
          defaultValue={maxPrice ?? ""}
          className="w-48 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />

        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => {
          const avgRating =
            teacher.reviews.length > 0
              ? teacher.reviews.reduce((sum, r) => sum + r.rating, 0) /
                teacher.reviews.length
              : null;

          return (
            <Link
              key={teacher.id}
              href={`/teachers/${teacher.id}`}
              className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">
                  {teacher.user.name}
                </h3>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatPrice(teacher.pricePerHour)}/h
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                {teacher.headline}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {teacher.languages.map((tl) => (
                  <span
                    key={tl.id}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                  >
                    {tl.language.name}
                  </span>
                ))}
              </div>
              {avgRating !== null && (
                <p className="mt-3 text-sm text-amber-600">
                  ★ {avgRating.toFixed(1)} ({teacher.reviews.length} reseñas)
                </p>
              )}
            </Link>
          );
        })}

        {teachers.length === 0 && (
          <p className="col-span-full text-sm text-neutral-500">
            No se encontraron profesores con esos filtros.
          </p>
        )}
      </div>
    </div>
  );
}
