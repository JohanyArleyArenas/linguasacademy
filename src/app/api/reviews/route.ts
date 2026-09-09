import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/session-guards";
import { reviewSchema } from "@/lib/validation";
import { z } from "zod";

const bodySchema = reviewSchema.extend({ bookingId: z.string() });

export async function POST(req: Request) {
  const studentProfile = await requireStudentProfile();
  if (!studentProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { lesson: true, review: true },
  });

  if (!booking || booking.studentId !== studentProfile.id) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  if (!booking.lesson?.completedAt) {
    return NextResponse.json(
      { error: "Solo puedes calificar clases completadas." },
      { status: 400 }
    );
  }

  if (booking.review) {
    return NextResponse.json({ error: "Ya calificaste esta clase." }, { status: 409 });
  }

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      studentId: studentProfile.id,
      teacherId: booking.teacherId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json({ ok: true });
}
