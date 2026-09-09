import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";

export default async function AdminStudentsPage() {
  if (!(await requireAdmin())) redirect("/login");

  const students = await prisma.studentProfile.findMany({
    include: { user: true, bookings: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Correo</th>
            <th className="px-4 py-3">País</th>
            <th className="px-4 py-3">Reservas</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-t border-neutral-100">
              <td className="px-4 py-3 font-medium text-neutral-900">
                {student.user.name}
              </td>
              <td className="px-4 py-3 text-neutral-600">{student.user.email}</td>
              <td className="px-4 py-3 text-neutral-600">
                {student.user.country ?? "—"}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {student.bookings.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && (
        <p className="p-4 text-sm text-neutral-500">No hay estudiantes registrados.</p>
      )}
    </div>
  );
}
