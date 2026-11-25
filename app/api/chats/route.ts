import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы открыть сообщения.", 401);

  const chats = await db.chat.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      buyer: { select: { id: true, name: true, role: true } },
      seller: { select: { id: true, name: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  const unreadCounts = chats.length ? await db.chatMessage.groupBy({
    by: ["chatId"],
    where: { chatId: { in: chats.map((chat) => chat.id) }, recipientId: user.id, readAt: null },
    _count: { _all: true },
  }) : [];
  const unreadByChat = new Map(unreadCounts.map((entry) => [entry.chatId, entry._count._all]));

  return Response.json(chats.map((chat) => {
    const peer = chat.buyerId === user.id ? chat.seller : chat.buyer;
    const lastMessage = chat.messages[0] ?? null;
    return {
      id: chat.id,
      peer: { id: peer.id, name: peer.name, role: peer.role },
      lastMessage: lastMessage ? {
        body: lastMessage.body,
        createdAt: lastMessage.createdAt,
        senderId: lastMessage.senderId,
        senderRole: lastMessage.senderId === chat.buyerId ? "buyer" : "seller",
      } : null,
      unreadCount: unreadByChat.get(chat.id) ?? 0,
      updatedAt: chat.updatedAt,
    };
  }));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы написать сообщение.", 401);
  if (user.role !== "buyer" && user.role !== "seller") return jsonError("Личные чаты доступны покупателям и продавцам.", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Проверьте данные чата."); }
  if (!isRecord(body) || typeof body.peerId !== "string" || !body.peerId || body.peerId === user.id) {
    return jsonError("Выберите собеседника.");
  }
  const peer = await db.user.findUnique({ where: { id: body.peerId }, select: { id: true, role: true, blocked: true } });
  if (!peer || peer.blocked) return jsonError("Пользователь не найден или недоступен.", 404);
  if (!((user.role === "buyer" && peer.role === "seller") || (user.role === "seller" && peer.role === "buyer"))) {
    return jsonError("В чате могут общаться покупатель и продавец.", 403);
  }

  const buyerId = user.role === "buyer" ? user.id : peer.id;
  const sellerId = user.role === "seller" ? user.id : peer.id;
  try {
    const chat = await db.chat.upsert({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      create: { buyerId, sellerId },
      update: {},
      select: { id: true },
    });
    return Response.json(chat, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const chat = await db.chat.findUnique({ where: { buyerId_sellerId: { buyerId, sellerId } }, select: { id: true } });
      if (chat) return Response.json(chat);
    }
    throw error;
  }
}
