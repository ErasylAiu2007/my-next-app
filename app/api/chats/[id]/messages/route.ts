import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы открыть чат.", 401);
  const { id } = await params;
  const chat = await db.chat.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, role: true } },
      seller: { select: { id: true, name: true, role: true } },
    },
  });
  if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) return jsonError("Чат не найден.", 404);

  await db.chatMessage.updateMany({
    where: { chatId: chat.id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  const messages = await db.chatMessage.findMany({
    where: { chatId: chat.id },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const peer = chat.buyerId === user.id ? chat.seller : chat.buyer;
  return Response.json({ currentUserId: user.id, peer, messages });
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы отправить сообщение.", 401);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Введите текст сообщения."); }
  if (!isRecord(body) || typeof body.body !== "string") return jsonError("Введите текст сообщения.");
  const messageBody = body.body.trim();
  if (!messageBody) return jsonError("Сообщение не может быть пустым.");
  if (messageBody.length > 2000) return jsonError("Сообщение не должно превышать 2000 символов.");

  const { id } = await params;
  const chat = await db.chat.findUnique({ where: { id }, select: { id: true, buyerId: true, sellerId: true } });
  if (!chat || (chat.buyerId !== user.id && chat.sellerId !== user.id)) return jsonError("Чат не найден.", 404);
  const recipientId = chat.buyerId === user.id ? chat.sellerId : chat.buyerId;
  const message = await db.chatMessage.create({
    data: { chatId: chat.id, senderId: user.id, recipientId, body: messageBody },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  await db.chat.update({ where: { id: chat.id }, data: { updatedAt: message.createdAt } });
  return Response.json(message, { status: 201 });
}
