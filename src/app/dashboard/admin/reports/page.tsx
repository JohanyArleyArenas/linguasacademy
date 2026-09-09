import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { AdminActionButton } from "@/components/admin-action-button";

export default async function AdminReportsPage() {
  if (!(await requireAdmin())) redirect("/login");

  const reports = await prisma.report.findMany({
    include: {
      reporter: true,
      review: { include: { teacher: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-lg border border-neutral-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-600">
                Reportado por {report.reporter.name}
              </p>
              {report.review && (
                <p className="text-sm text-neutral-800">
                  Reseña sobre {report.review.teacher.user.name}:{" "}
                  <span className="italic">
                    &ldquo;{report.review.comment ?? "(sin comentario)"}&rdquo;
                  </span>
                </p>
              )}
              <p className="mt-1 text-sm text-neutral-600">
                Motivo: {report.reason}
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {report.status}
            </span>
          </div>

          {report.status === "OPEN" && (
            <div className="mt-3 flex gap-4">
              <AdminActionButton
                url={`/api/admin/reports/${report.id}`}
                body={{ action: "HIDE_REVIEW" }}
                label="Ocultar reseña y resolver"
              />
              <AdminActionButton
                url={`/api/admin/reports/${report.id}`}
                body={{ action: "DISMISS" }}
                label="Descartar reporte"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-800"
              />
            </div>
          )}
        </div>
      ))}
      {reports.length === 0 && (
        <p className="text-sm text-neutral-500">No hay reportes.</p>
      )}
    </div>
  );
}
