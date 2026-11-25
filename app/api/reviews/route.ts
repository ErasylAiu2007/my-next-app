import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sellerId = url.searchParams.get("sellerId");
  const orderId = url.searchParams.get("orderId");

  if (orderId) {
    const user = await getCurrentUser();
    if (!user) return jsonError("Войдите в аккаунт.", 401);
    const review = await db.review.findUnique({ where: { orderId }, include: { buyer: { select: { id: true, name: true } } } });
    if (review && review.buyerId !== user.id && user.role !== "admin") return jsonError("Нет доступа к отзыву.", 403);
    return Response.json(review ?? null);
  }

  if (!sellerId) return jsonError("Не указан продавец.", 400);
  const reviews = await db.review.findMany({
    where: { sellerId, hidden: false },
    include: { buyer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const categoryMap = new Map<string, number[]>();
  for (const review of reviews) {
    const ratings = categoryMap.get(review.category) ?? [];
    ratings.push(review.rating);
    categoryMap.set(review.category, ratings);
  }
  const categories = Array.from(categoryMap.entries()).map(([category, ratings]) => ({
    category,
    average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
    count: ratings.length,
  })).sort((a, b) => b.count - a.count);

  return Response.json({
    average: Math.round(average * 10) / 10,
    count: reviews.length,
    categories,
    reviews: reviews.map((review) => ({
      id: review.id, rating: review.rating, comment: review.comment, category: review.category,
      createdAt: review.createdAt, buyerName: review.buyer.name,
    })),
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт.", 401);
  if (user.role !== "buyer") return jsonError("Оставлять отзывы могут только покупатели.", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Проверьте данные отзыва."); }
  if (!isRecord(body) || typeof body.orderId !== "string") return jsonError("Не указан заказ.");
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return jsonError("Оценка должна быть от 1 до 5.");
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (comment.length > 500) return jsonError("Отзыв не должен превышать 500 символов.");

  const order = await db.order.findUnique({ where: { id: body.orderId }, include: { service: { select: { category: true } } } });
  if (!order) return jsonError("Заказ не найден.", 404);
  if (order.buyerId !== user.id) return jsonError("Отзыв можно оставить только за свой заказ.", 403);
  if (order.status !== "completed") return jsonError("Отзыв можно оставить только после завершения заказа.", 409);

  try {
    const review = await db.review.create({
      data: { orderId: order.id, buyerId: user.id, sellerId: order.sellerId,
        category: order.service?.category ?? order.serviceTitle, rating: body.rating, comment },
    });
    return Response.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return jsonError("Вы уже оставили отзыв за этот заказ.", 409);
    throw error;
  }
}
