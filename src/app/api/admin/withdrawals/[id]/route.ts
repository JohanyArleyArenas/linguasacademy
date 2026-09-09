import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { z } from "zod";

const schema = z.object({ action: z.enum(["APPROVE", "PAY", "REJECT"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) {
    return NextResponse.json({ error: "Retiro no encontrado." }, { status: 404 });
  }

  if (parsed.data.action === "REJECT") {
    await prisma.$transaction([
      prisma.withdrawal.update({
        where: { id },
        data: { status: "REJECTED", resolvedAt: new Date() },
      }),
      prisma.teacherProfile.update({
        where: { id: withdrawal.teacherId },
        data: { balanceCents: { increment: withdrawal.amountCents } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  await prisma.withdrawal.update({
    where: { id },
    data: {
      status: parsed.data.action === "PAY" ? "PAID" : "APPROVED",
      resolvedAt: parsed.data.action === "PAY" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
