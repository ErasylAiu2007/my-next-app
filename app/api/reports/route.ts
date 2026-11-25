import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

const reasons = [
  "Оскорбления и мат",
  "Мошенничество",
  "Спам",
  "Недостоверная информация",
  "Запрещённый контент",
  "Проблема с заказом",
  "Другое",
];

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы отправить жалобу.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте данные жалобы.");
  }
  if (!isRecord(body) || (body.targetType !== "service" && body.targetType !== "order") || typeof body.targetId !== "string") {
    return jsonError("Не удалось определить объект жалобы.");
  }
  if (typeof body.reason !== "string" || !reasons.includes(body.reason)) return jsonError("Выберите причину жалобы.");
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 1000) return jsonError("Описание не должно превышать 1000 символов.");

  if (body.targetType === "service") {
    const service = await db.service.findFirst({ where: { id: body.targetId, status: "published", seller: { blocked: false } } });
    if (!service) return jsonError("Услуга недоступна для жалобы.", 404);
  } else {
    const order = await db.order.findUnique({ where: { id: body.targetId }, select: { buyerId: true, sellerId: true } });
    if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) return jsonError("Подать жалобу на этот заказ могут только его участники.", 403);
  }

  try {
    const report = await db.report.create({
      data: { reporterId: user.id, targetType: body.targetType, targetId: body.targetId, reason: body.reason, description },
      select: { id: true, status: true },
    });
    return Response.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Вы уже отправили жалобу на этот объект.", 409);
    }
    throw error;
  }
}
