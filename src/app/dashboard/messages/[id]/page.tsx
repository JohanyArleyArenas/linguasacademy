import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getConversationForUser } from "@/lib/conversations";
import { MessageComposer } from "@/components/message-composer";

export default async function ConversationPage({
  params,
}: PageProps<"/dashboard/messages/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

  const conversation = await getConversationForUser(id, userId);
  if (!conversation) notFound();

  const other = conversation.participants.find((p) => p.userId !== userId)?.user;

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/messages"
        className="text-sm text-neutral-600 hover:text-neutral-900"
      >
        ← Volver a mensajes
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
        {other?.name ?? "Conversación"}
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {messages.map((message) => {
          const isMine = message.senderId === userId;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                isMine
                  ? "self-end bg-emerald-600 text-white"
                  : "self-start bg-white text-neutral-800 ring-1 ring-neutral-200"
              }`}
            >
              <p className="whitespace-pre-line text-sm">{message.body}</p>
              <p
                className={`mt-1 text-xs ${
                  isMine ? "text-emerald-100" : "text-neutral-400"
                }`}
              >
                {formatDateTime(message.createdAt)}
              </p>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">
            No hay mensajes todavía. Escribe el primero.
          </p>
        )}
      </div>

      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
