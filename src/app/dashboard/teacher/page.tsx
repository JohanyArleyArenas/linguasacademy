import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { formatDateTime, formatPrice } from "@/lib/format";
import { CompleteBookingButton } from "@/components/complete-booking-button";
import { WithdrawalForm } from "@/components/withdrawal-form";

const statusLabel: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  SUSPENDED: "Suspendido",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-neutral-200 text-neutral-700",
};

const bookingStatusLabel: Record<string, string> = {
  PENDING: "Pago pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default async function TeacherDashboardPage() {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) redirect("/login");

  const full = await prisma.teacherProfile.findUniqueOrThrow({
    where: { id: teacherProfile.id },
    include: {
      bookings: {
        include: {
          student: { include: { user: true } },
          availability: true,
          lesson: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
      withdrawals: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const avgRating =
    full.reviews.length > 0
      ? full.reviews.reduce((sum, r) => sum + r.rating, 0) / full.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Panel de profesor
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[full.status]}`}
        >
          Perfil: {statusLabel[full.status]}
        </span>
      </div>

      {full.status === "REJECTED" && full.rejectionNote && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          Tu perfil fue rechazado: {full.rejectionNote}
        </div>
      )}
      {!full.headline && (
        <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
          Completa tu perfil para empezar a recibir estudiantes.{" "}
          <Link href="/dashboard/teacher/profile" className="font-medium underline">
            Editar perfil
          </Link>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard/teacher/profile"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Editar perfil
        </Link>
        <Link
          href="/dashboard/teacher/availability"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Gestionar disponibilidad
        </Link>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Saldo disponible</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">
            {formatPrice(full.balanceCents / 100)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Clases completadas</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">
            {full.bookings.filter((b) => b.status === "COMPLETED").length}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Calificación</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">
            {avgRating !== null ? `★ ${avgRating.toFixed(1)}` : "—"}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-neutral-900">Retiros</h2>
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
          <WithdrawalForm balanceCents={full.balanceCents} />
          {full.withdrawals.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 text-xs text-neutral-600">
              {full.withdrawals.map((w) => (
                <li key={w.id}>
                  {formatPrice(w.amountCents / 100)} — {w.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-neutral-900">Mis clases</h2>
        <div className="mt-4 flex flex-col gap-3">
          {full.bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {booking.student.user.name}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatDateTime(booking.availability.startsAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  {bookingStatusLabel[booking.status]}
                </span>
                {booking.status === "CONFIRMED" && !booking.lesson?.completedAt && (
                  <CompleteBookingButton bookingId={booking.id} />
                )}
              </div>
            </div>
          ))}
          {full.bookings.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no tienes reservas de estudiantes.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
