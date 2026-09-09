import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id: bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { lesson: true },
  });

  if (!booking || booking.teacherId !== teacherProfile.id) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  if (booking.status !== "CONFIRMED" || !booking.lesson) {
    return NextResponse.json({ error: "Esta reserva no se puede completar." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.lesson.update({
      where: { id: booking.lesson.id },
      data: { completedAt: new Date() },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
