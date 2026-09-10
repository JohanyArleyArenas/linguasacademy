import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const membership = await prisma.conversationUser.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Conversación no encontrada." },
      { status: 404 }
    );
  }

  await prisma.conversationUser.update({
    where: { id: membership.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
