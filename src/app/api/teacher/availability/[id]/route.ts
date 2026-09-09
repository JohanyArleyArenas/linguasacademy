import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherProfile } from "@/lib/session-guards";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherProfile = await requireTeacherProfile();
  if (!teacherProfile) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const slot = await prisma.availability.findUnique({ where: { id } });
  if (!slot || slot.teacherId !== teacherProfile.id) {
    return NextResponse.json({ error: "Horario no encontrado." }, { status: 404 });
  }

  if (slot.isBooked) {
    return NextResponse.json(
      { error: "No puedes eliminar un horario ya reservado." },
      { status: 400 }
    );
  }

  await prisma.availability.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
