import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { TeacherProfileForm } from "@/components/teacher-profile-form";

export default async function TeacherProfileEditPage() {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) redirect("/login");

  const [full, languages, specialties] = await Promise.all([
    prisma.teacherProfile.findUniqueOrThrow({
      where: { id: teacherProfile.id },
      include: { languages: true, specialties: true },
    }),
    prisma.language.findMany({ orderBy: { name: "asc" } }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Editar mi perfil de profesor
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Los cambios se enviarán a revisión del equipo de Lingua&apos;s Academy antes
        de publicarse.
      </p>

      <div className="mt-8">
        <TeacherProfileForm
          languages={languages}
          specialties={specialties}
          initial={{
            headline: full.headline ?? "",
            bio: full.bio ?? "",
            videoUrl: full.videoUrl ?? "",
            pricePerHour: Number(full.pricePerHour),
            languageIds: full.languages.map((l) => l.languageId),
            specialtyIds: full.specialties.map((s) => s.specialtyId),
          }}
        />
      </div>
    </div>
  );
}
