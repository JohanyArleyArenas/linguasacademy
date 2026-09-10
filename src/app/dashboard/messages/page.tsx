import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const memberships = await prisma.conversationUser.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  const lastReadByConversation = new Map(
    memberships.map((m) => [m.conversationId, m.lastReadAt])
  );

  const sorted = conversations
    .map((conversation) => {
      const lastMessage = conversation.messages[0];
      const lastReadAt = lastReadByConversation.get(conversation.id);
      const isUnread =
        !!lastMessage &&
        lastMessage.senderId !== userId &&
        (!lastReadAt || lastMessage.createdAt > lastReadAt);

      return {
        conversation,
        lastMessage,
        isUnread,
        other: conversation.participants.find((p) => p.userId !== userId)?.user,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt.getTime() ?? 0;
      const bTime = b.lastMessage?.createdAt.getTime() ?? 0;
      return bTime - aTime;
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Mensajes</h1>

      <div className="mt-6 flex flex-col gap-2">
        {sorted.map(({ conversation, lastMessage, isUnread, other }) => (
          <Link
            key={conversation.id}
            href={`/dashboard/messages/${conversation.id}`}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-emerald-300"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-neutral-900">
                {other?.name ?? "Usuario"}
              </span>
              <span className="flex items-center gap-2">
                {isUnread && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                    Nuevo
                  </span>
                )}
                {lastMessage && (
                  <span className="text-xs text-neutral-500">
                    {formatDateTime(lastMessage.createdAt)}
                  </span>
                )}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-neutral-600">
              {lastMessage?.body ?? "Sin mensajes todavía"}
            </p>
          </Link>
        ))}

        {sorted.length === 0 && (
          <p className="text-sm text-neutral-500">
            Aún no tienes conversaciones. Escríbele a un profesor desde su
            perfil para empezar.
          </p>
        )}
      </div>
    </div>
  );
}
