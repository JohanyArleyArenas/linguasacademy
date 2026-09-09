import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { formatPrice } from "@/lib/format";

export default async function AdminOverviewPage() {
  if (!(await requireAdmin())) redirect("/login");

  const [
    studentCount,
    teacherCount,
    pendingTeachers,
    bookingCount,
    openReports,
    revenueAgg,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.teacherProfile.count({ where: { status: "PENDING" } }),
    prisma.booking.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    }),
  ]);

  const stats = [
    { label: "Estudiantes", value: studentCount },
    { label: "Profesores", value: teacherCount },
    { label: "Perfiles por aprobar", value: pendingTeachers },
    { label: "Reservas totales", value: bookingCount },
    { label: "Reportes abiertos", value: openReports },
    {
      label: "Ingresos procesados",
      value: formatPrice((revenueAgg._sum.amountCents ?? 0) / 100),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <p className="text-xs text-neutral-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
