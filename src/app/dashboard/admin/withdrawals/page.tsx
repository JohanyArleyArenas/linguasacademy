import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { formatPrice } from "@/lib/format";
import { AdminActionButton } from "@/components/admin-action-button";

export default async function AdminWithdrawalsPage() {
  if (!(await requireAdmin())) redirect("/login");

  const withdrawals = await prisma.withdrawal.findMany({
    include: { teacher: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-3">
      {withdrawals.map((w) => (
        <div
          key={w.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-neutral-900">
              {w.teacher.user.name}
            </p>
            <p className="text-sm text-neutral-600">
              {formatPrice(w.amountCents / 100)} · {w.status}
            </p>
          </div>
          {w.status === "REQUESTED" && (
            <div className="flex gap-3">
              <AdminActionButton
                url={`/api/admin/withdrawals/${w.id}`}
                body={{ action: "APPROVE" }}
                label="Aprobar"
              />
              <AdminActionButton
                url={`/api/admin/withdrawals/${w.id}`}
                body={{ action: "REJECT" }}
                label="Rechazar"
                className="text-sm font-medium text-red-600 hover:text-red-500"
              />
            </div>
          )}
          {w.status === "APPROVED" && (
            <AdminActionButton
              url={`/api/admin/withdrawals/${w.id}`}
              body={{ action: "PAY" }}
              label="Marcar como pagado"
            />
          )}
        </div>
      ))}
      {withdrawals.length === 0 && (
        <p className="text-sm text-neutral-500">
          No hay solicitudes de retiro.
        </p>
      )}
    </div>
  );
}
