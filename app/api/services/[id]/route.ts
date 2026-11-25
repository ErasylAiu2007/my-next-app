import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };
const categories = ["Видеомонтаж", "Съёмка", "Анимация", "Реклама", "Цветокоррекция"];

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const service = await db.service.findFirst({
    where: { id, status: "published", seller: { blocked: false } },
    include: { seller: { select: { id: true, name: true } } },
  });
  if (!service) return jsonError("Услуга не найдена.", 404);
  return Response.json({ ...service, sellerName: service.seller.name });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт.", 401);
  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return jsonError("Услуга не найдена.", 404);
  if (existing.sellerId !== user.id && user.role !== "admin") return jsonError("Нет доступа к этой услуге.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте данные услуги.");
  }
  if (!isRecord(body)) return jsonError("Проверьте данные услуги.");
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (title.length < 3 || title.length > 100 || description.length < 10 || description.length > 1200) {
    return jsonError("Проверьте длину названия и описания.");
  }
  if (typeof body.price !== "number" || !Number.isSafeInteger(body.price) || body.price < 1 || typeof body.category !== "string" || !categories.includes(body.category)) {
    return jsonError("Проверьте цену и категорию.");
  }
  for (const media of [body.imageUrl, body.videoUrl]) {
    if (media === undefined || media === "") continue;
    if (typeof media !== "string" || media.length > 2048) return jsonError("Некорректная ссылка на медиа.");
    try {
      if (!["http:", "https:"].includes(new URL(media).protocol)) return jsonError("Ссылки на медиа должны использовать HTTP или HTTPS.");
    } catch {
      return jsonError("Некорректная ссылка на медиа.");
    }
  }

  const service = await db.service.update({
    where: { id },
    data: {
      title,
      description,
      price: body.price,
      category: body.category,
      ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl } : {}),
      ...(typeof body.videoUrl === "string" ? { videoUrl: body.videoUrl } : {}),
    },
  });
  return Response.json(service);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт.", 401);
  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id }, select: { sellerId: true } });
  if (!existing) return jsonError("Услуга не найдена.", 404);
  if (existing.sellerId !== user.id && user.role !== "admin") return jsonError("Нет доступа к этой услуге.", 403);
  await db.service.delete({ where: { id } });
  return Response.json({ ok: true });
}
