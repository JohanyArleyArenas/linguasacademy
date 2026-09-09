import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { teacherProfileSchema } from "@/lib/validation";

export async function PUT(req: Request) {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = teacherProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { headline, bio, videoUrl, pricePerHour, languageIds, specialtyIds } =
    parsed.data;

  await prisma.$transaction([
    prisma.teacherProfile.update({
      where: { id: teacherProfile.id },
      data: {
        headline,
        bio,
        videoUrl: videoUrl || null,
        pricePerHour,
        status: "PENDING",
      },
    }),
    prisma.teacherLanguage.deleteMany({ where: { teacherId: teacherProfile.id } }),
    prisma.teacherLanguage.createMany({
      data: languageIds.map((languageId) => ({
        teacherId: teacherProfile.id,
        languageId,
        level: "Nativo o fluido",
      })),
    }),
    prisma.teacherSpecialty.deleteMany({ where: { teacherId: teacherProfile.id } }),
    prisma.teacherSpecialty.createMany({
      data: specialtyIds.map((specialtyId) => ({
        teacherId: teacherProfile.id,
        specialtyId,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
