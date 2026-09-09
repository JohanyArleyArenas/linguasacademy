import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["RESOLVE", "DISMISS", "HIDE_REVIEW"]),
});

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

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  if (parsed.data.action === "HIDE_REVIEW" && report.reviewId) {
    await prisma.review.update({
      where: { id: report.reviewId },
      data: { isHidden: true },
    });
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.action === "DISMISS" ? "DISMISSED" : "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
