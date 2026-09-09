import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { availabilitySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = availabilitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  if (endsAt <= startsAt || startsAt < new Date()) {
    return NextResponse.json({ error: "Horario inválido." }, { status: 400 });
  }

  const slot = await prisma.availability.create({
    data: { teacherId: teacherProfile.id, startsAt, endsAt },
  });

  return NextResponse.json({ id: slot.id });
}
