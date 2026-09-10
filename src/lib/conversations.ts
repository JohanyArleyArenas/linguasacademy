import { prisma } from "@/lib/prisma";

export async function getConversationForUser(
  conversationId: string,
  userId: string
) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
    include: {
      participants: { include: { user: true } },
    },
  });
}

export async function countUnreadMessages(userId: string) {
  const memberships = await prisma.conversationUser.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });

  if (memberships.length === 0) return 0;

  return prisma.message.count({
    where: {
      senderId: { not: userId },
      OR: memberships.map((m) => ({
        conversationId: m.conversationId,
        ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
      })),
    },
  });
}
