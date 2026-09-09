import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  await prisma.teacherProfile.update({
    where: { id },
    data: { status: "APPROVED", rejectionNote: null },
  });

  return NextResponse.json({ ok: true });
}
