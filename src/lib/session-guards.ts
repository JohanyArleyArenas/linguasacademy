import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireStudentProfile() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") return null;

  return prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
}

export async function requireTeacherProfile() {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") return null;

  return prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}
