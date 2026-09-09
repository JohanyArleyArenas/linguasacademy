import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";
import { z } from "zod";

const schema = z.object({ note: z.string().max(1000).optional() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));

  await prisma.teacherProfile.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionNote: parsed.success ? parsed.data.note : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
