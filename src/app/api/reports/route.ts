import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = reportSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
  });
  if (!review) {
    return NextResponse.json({ error: "Reseña no encontrada." }, { status: 404 });
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      reviewId: review.id,
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true });
}
