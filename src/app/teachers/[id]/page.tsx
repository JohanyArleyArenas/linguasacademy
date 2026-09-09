import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice, formatDateTime } from "@/lib/format";
import { FavoriteButton } from "@/components/favorite-button";
import { BookSlotButton } from "@/components/book-slot-button";
import { ReportReviewButton } from "@/components/report-review-button";

export default async function TeacherProfilePage({
  params,
}: PageProps<"/teachers/[id]">) {
  const { id } = await params;
  const session = await auth();

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      user: true,
      languages: { include: { language: true } },
      specialties: { include: { specialty: true } },
      reviews: {
        where: { isHidden: false },
        include: { student: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
      availability: {
        where: { isBooked: false, startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 20,
      },
    },
  });

  if (!teacher) notFound();

  const avgRating =
    teacher.reviews.length > 0
      ? teacher.reviews.reduce((sum, r) => sum + r.rating, 0) / teacher.reviews.length
      : null;

  let isFavorited = false;
  if (session?.user) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_teacherId: { userId: session.user.id, teacherId: teacher.id } },
    });
    isFavorited = !!fav;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {teacher.user.name}
              </h1>
              <p className="mt-1 text-neutral-600">{teacher.headline}</p>
              {avgRating !== null && (
                <p className="mt-2 text-sm text-amber-600">
                  ★ {avgRating.toFixed(1)} ({teacher.reviews.length} reseñas)
                </p>
              )}
            </div>
            <FavoriteButton
              teacherId={teacher.id}
              initialFavorited={isFavorited}
              isAuthed={!!session?.user}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.languages.map((tl) => (
              <span
                key={tl.id}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                {tl.language.name} · {tl.level}
              </span>
            ))}
            {teacher.specialties.map((ts) => (
              <span
                key={ts.id}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                {ts.specialty.name}
              </span>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-medium text-neutral-900">
              Sobre mí
            </h2>
            <p className="mt-2 whitespace-pre-line text-neutral-700">
              {teacher.bio}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-medium text-neutral-900">
              Reseñas de estudiantes
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {teacher.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">
                      {review.student.user.name}
                    </span>
                    <span className="text-amber-600">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-neutral-600">
                      {review.comment}
                    </p>
                  )}
                  <ReportReviewButton reviewId={review.id} isAuthed={!!session?.user} />
                </div>
              ))}
              {teacher.reviews.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Este profesor aún no tiene reseñas.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <p className="text-2xl font-semibold text-neutral-900">
              {formatPrice(teacher.pricePerHour)}
              <span className="text-sm font-normal text-neutral-500">/hora</span>
            </p>

            <h3 className="mt-5 text-sm font-medium text-neutral-900">
              Horarios disponibles
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {teacher.availability.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 p-2"
                >
                  <span className="text-xs text-neutral-700">
                    {formatDateTime(slot.startsAt)}
                  </span>
                  <div className="w-28">
                    <BookSlotButton
                      availabilityId={slot.id}
                      isStudent={session?.user?.role === "STUDENT"}
                      isAuthed={!!session?.user}
                    />
                  </div>
                </div>
              ))}
              {teacher.availability.length === 0 && (
                <p className="text-sm text-neutral-500">
                  No hay horarios disponibles por ahora.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
