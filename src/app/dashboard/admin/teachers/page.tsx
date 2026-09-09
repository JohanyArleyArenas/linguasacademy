import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { formatPrice } from "@/lib/format";
import { AdminActionButton } from "@/components/admin-action-button";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-neutral-200 text-neutral-700",
};

export default async function AdminTeachersPage() {
  if (!(await requireAdmin())) redirect("/login");

  const teachers = await prisma.teacherProfile.findMany({
    include: { user: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-3">
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-neutral-900">{teacher.user.name}</p>
            <p className="text-sm text-neutral-600">
              {teacher.user.email} · {formatPrice(teacher.pricePerHour)}/h
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {teacher.headline || "Sin titular todavía"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[teacher.status]}`}
            >
              {teacher.status}
            </span>
            {teacher.status !== "APPROVED" && (
              <AdminActionButton
                url={`/api/admin/teachers/${teacher.id}/approve`}
                label="Aprobar"
              />
            )}
            {teacher.status !== "REJECTED" && (
              <AdminActionButton
                url={`/api/admin/teachers/${teacher.id}/reject`}
                label="Rechazar"
                className="text-sm font-medium text-red-600 hover:text-red-500"
              />
            )}
            {teacher.status === "APPROVED" && (
              <AdminActionButton
                url={`/api/admin/teachers/${teacher.id}/suspend`}
                label="Suspender"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-800"
                confirmMessage="¿Suspender a este profesor? No aparecerá en las búsquedas."
              />
            )}
          </div>
        </div>
      ))}
      {teachers.length === 0 && (
        <p className="text-sm text-neutral-500">No hay profesores registrados.</p>
      )}
    </div>
  );
}
