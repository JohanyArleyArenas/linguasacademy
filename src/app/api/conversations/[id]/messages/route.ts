import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validation";

export async function POST(
  req: Request,
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

  const parsed = messageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      body: parsed.data.body,
    },
  });

  await prisma.conversationUser.update({
    where: { id: membership.id },
    data: { lastReadAt: message.createdAt },
  });

  return NextResponse.json({ id: message.id });
}
