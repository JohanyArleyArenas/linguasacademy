import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";
import { z } from "zod";

const schema = z.object({ amountCents: z.number().int().positive() });

export async function POST(req: Request) {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
  }

  if (parsed.data.amountCents > teacherProfile.balanceCents) {
    return NextResponse.json(
      { error: "El monto supera tu saldo disponible." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.withdrawal.create({
      data: { teacherId: teacherProfile.id, amountCents: parsed.data.amountCents },
    }),
    prisma.teacherProfile.update({
      where: { id: teacherProfile.id },
      data: { balanceCents: { decrement: parsed.data.amountCents } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
