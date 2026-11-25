import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы посмотреть заказы.", 401);
  const orders = await db.order.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(orders);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы оформить заказ.", 401);
  if (user.role !== "buyer") return jsonError("Оформить заказ может только покупатель.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Не удалось оформить заказ.");
  }
  if (!isRecord(body) || typeof body.serviceId !== "string") return jsonError("Выберите услугу.");
  const service = await db.service.findFirst({
    where: { id: body.serviceId, status: "published", seller: { blocked: false } },
  });
  if (!service) return jsonError("Услуга недоступна.", 404);
  if (service.sellerId === user.id) return jsonError("Нельзя заказать собственную услугу.");

  const order = await db.order.create({
    data: {
      buyerId: user.id,
      sellerId: service.sellerId,
      serviceId: service.id,
      serviceTitle: service.title,
      price: service.price,
    },
  });
  return Response.json(order, { status: 201 });
}
