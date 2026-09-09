import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { AvailabilityManager } from "@/components/availability-manager";

export default async function TeacherAvailabilityPage() {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) redirect("/login");

  const slots = await prisma.availability.findMany({
    where: { teacherId: teacherProfile.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Mi disponibilidad
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Agrega horarios para que los estudiantes puedan reservar clases
        contigo.
      </p>

      <div className="mt-8">
        <AvailabilityManager
          slots={slots.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            isBooked: s.isBooked,
          }))}
        />
      </div>
    </div>
  );
}
