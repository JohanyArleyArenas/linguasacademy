import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/session-guards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const studentProfile = await requireStudentProfile();
  if (!studentProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id: bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking || booking.studentId !== studentProfile.id) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  if (!booking.payment || booking.payment.status === "PAID") {
    return NextResponse.json({ error: "Pago inválido." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: "PAID",
        transaction: {
          create: { type: "CHARGE", amountCents: booking.payment.amountCents },
        },
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", lesson: { create: {} } },
    }),
    prisma.teacherProfile.update({
      where: { id: booking.teacherId },
      data: { balanceCents: { increment: booking.payment.amountCents } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
