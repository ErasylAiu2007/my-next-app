import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };
const allowedStatuses = ["accepted", "in_progress", "completed", "cancelled"] as const;

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт.", 401);
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== "admin")) {
    return jsonError("Заказ не найден.", 404);
  }
  return Response.json(order);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Выберите новый статус.");
  }
  const nextStatus = isRecord(body) && typeof body.status === "string"
    ? allowedStatuses.find((status) => status === body.status)
    : undefined;
  if (!nextStatus) {
    return jsonError("Недопустимый статус заказа.");
  }
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return jsonError("Заказ не найден.", 404);
  const sellerMaySet =
    user.id === order.sellerId &&
    (order.status === "pending" && ["accepted", "cancelled"].includes(nextStatus) ||
      order.status === "accepted" && ["in_progress", "cancelled"].includes(nextStatus) ||
      order.status === "in_progress" && nextStatus === "cancelled");
  const buyerMaySet =
    user.id === order.buyerId &&
    (order.status === "in_progress" && nextStatus === "completed" ||
      ["pending", "accepted", "in_progress"].includes(order.status) && nextStatus === "cancelled");
  if (!sellerMaySet && !buyerMaySet && user.role !== "admin") return jsonError("У вас нет прав для этого действия.", 403);
  if (order.status === "completed" || order.status === "cancelled") return jsonError("Завершённый заказ нельзя изменить.", 409);

  return Response.json(await db.order.update({ where: { id }, data: { status: nextStatus } }));
}
