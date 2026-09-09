import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { AddLanguageForm } from "@/components/add-language-form";
import { AdminActionButton } from "@/components/admin-action-button";

export default async function AdminLanguagesPage() {
  if (!(await requireAdmin())) redirect("/login");

  const languages = await prisma.language.findMany({
    include: { _count: { select: { teachers: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <AddLanguageForm />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {languages.map((lang) => (
          <div
            key={lang.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3"
          >
            <span className="text-sm text-neutral-800">
              {lang.name} ({lang.code}) — {lang._count.teachers} profesores
            </span>
            <AdminActionButton
              url={`/api/admin/languages/${lang.id}`}
              method="DELETE"
              label="Eliminar"
              className="text-sm font-medium text-red-600 hover:text-red-500"
              confirmMessage="¿Eliminar este idioma?"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
