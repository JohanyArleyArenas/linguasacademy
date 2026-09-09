import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/session-guards";
import { bookingSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const studentProfile = await requireStudentProfile();
  if (!studentProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const availability = await prisma.availability.findUnique({
    where: { id: parsed.data.availabilityId },
    include: { teacher: true },
  });

  if (!availability || availability.isBooked) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible." },
      { status: 409 }
    );
  }

  const priceCents = Math.round(Number(availability.teacher.pricePerHour) * 100);

  const booking = await prisma.$transaction(async (tx) => {
    const stillFree = await tx.availability.findUnique({
      where: { id: availability.id },
    });
    if (!stillFree || stillFree.isBooked) {
      throw new Error("SLOT_TAKEN");
    }

    await tx.availability.update({
      where: { id: availability.id },
      data: { isBooked: true },
    });

    return tx.booking.create({
      data: {
        studentId: studentProfile.id,
        teacherId: availability.teacherId,
        availabilityId: availability.id,
        priceCents,
        status: "PENDING",
        payment: {
          create: { amountCents: priceCents, status: "PENDING" },
        },
      },
    });
  }).catch((err) => {
    if (err instanceof Error && err.message === "SLOT_TAKEN") return null;
    throw err;
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible." },
      { status: 409 }
    );
  }

  return NextResponse.json({ id: booking.id });
}
