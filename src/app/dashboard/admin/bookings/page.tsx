import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { formatDateTime, formatPrice } from "@/lib/format";

export default async function AdminBookingsPage() {
  if (!(await requireAdmin())) redirect("/login");

  const bookings = await prisma.booking.findMany({
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      availability: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Estudiante</th>
            <th className="px-4 py-3">Profesor</th>
            <th className="px-4 py-3">Horario</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Pago</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-neutral-100">
              <td className="px-4 py-3 text-neutral-800">
                {booking.student.user.name}
              </td>
              <td className="px-4 py-3 text-neutral-800">
                {booking.teacher.user.name}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatDateTime(booking.availability.startsAt)}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatPrice(booking.priceCents / 100)}
              </td>
              <td className="px-4 py-3 text-neutral-600">{booking.status}</td>
              <td className="px-4 py-3 text-neutral-600">
                {booking.payment?.status ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="p-4 text-sm text-neutral-500">No hay reservas todavía.</p>
      )}
    </div>
  );
}
