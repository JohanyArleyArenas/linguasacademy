import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/session-guards";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ReviewForm } from "@/components/review-form";

const statusLabel: Record<string, string> = {
  PENDING: "Pago pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default async function StudentDashboardPage() {
  const studentProfile = await requireStudentProfile();
  if (!studentProfile) redirect("/login");

  const [bookings, favorites] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId: studentProfile.id },
      include: {
        teacher: { include: { user: true } },
        availability: true,
        lesson: true,
        review: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: studentProfile.userId },
      include: { teacher: { include: { user: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Mi panel</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-neutral-900">Mis clases</h2>
        <div className="mt-4 flex flex-col gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-900">
                    {booking.teacher.user.name}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatDateTime(booking.availability.startsAt)} ·{" "}
                    {formatPrice(booking.priceCents / 100)}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  {statusLabel[booking.status]}
                </span>
              </div>

              {booking.status === "PENDING" && (
                <Link
                  href={`/checkout/${booking.id}`}
                  className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Completar pago
                </Link>
              )}

              {booking.lesson?.completedAt && !booking.review && (
                <div className="mt-3">
                  <ReviewForm bookingId={booking.id} />
                </div>
              )}

              {booking.review && (
                <p className="mt-3 text-sm text-amber-600">
                  Ya calificaste esta clase: {"★".repeat(booking.review.rating)}
                </p>
              )}
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no tienes clases reservadas.{" "}
              <Link href="/teachers" className="text-indigo-600">
                Busca un profesor
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-neutral-900">
          Profesores favoritos
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/teachers/${fav.teacherId}`}
              className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-indigo-300"
            >
              <p className="font-medium text-neutral-900">
                {fav.teacher.user.name}
              </p>
              <p className="text-sm text-neutral-600">
                {formatPrice(fav.teacher.pricePerHour)}/h
              </p>
            </Link>
          ))}
          {favorites.length === 0 && (
            <p className="text-sm text-neutral-500">
              No tienes profesores guardados como favoritos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
