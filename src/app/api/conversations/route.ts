import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ teacherId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: parsed.data.teacherId },
    select: { userId: true },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Profesor no encontrado." }, { status: 404 });
  }

  if (teacher.userId === session.user.id) {
    return NextResponse.json(
      { error: "No puedes iniciar una conversación contigo mismo." },
      { status: 400 }
    );
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: teacher.userId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: session.user.id }, { userId: teacher.userId }],
      },
    },
  });

  return NextResponse.json({ id: conversation.id });
}
