import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

const categories = ["Видеомонтаж", "Съёмка", "Анимация", "Реклама", "Цветокоррекция"];

function validWebUrl(value: unknown): value is string {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const services = await db.service.findMany({
    where: { status: "published", seller: { blocked: false } },
    include: { seller: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const sellerIds = Array.from(new Set(services.map((service) => service.sellerId)));
  const reviewGroups = await db.review.groupBy({
    by: ["sellerId"],
    where: { sellerId: { in: sellerIds }, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingBySeller = new Map(reviewGroups.map((group) => [group.sellerId, {
    sellerRating: Math.round((group._avg.rating ?? 0) * 10) / 10,
    sellerReviewCount: group._count._all,
  }]));
  return Response.json(services.map(({ seller, ...service }) => ({
    ...service,
    sellerName: seller.name,
    ...(ratingBySeller.get(service.sellerId) ?? { sellerRating: 0, sellerReviewCount: 0 }),
  })));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Войдите в аккаунт, чтобы опубликовать услугу.", 401);
  if (user.role !== "seller") return jsonError("Публиковать услуги могут только продавцы.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте данные услуги.");
  }
  if (!isRecord(body)) return jsonError("Проверьте данные услуги.");
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = body.price;
  if (title.length < 3 || title.length > 100) return jsonError("Название должно содержать от 3 до 100 символов.");
  if (description.length < 10 || description.length > 1200) return jsonError("Описание должно содержать от 10 до 1200 символов.");
  if (typeof price !== "number" || !Number.isSafeInteger(price) || price < 1 || price > 100000000) return jsonError("Укажите корректную цену.");
  if (typeof body.category !== "string" || !categories.includes(body.category)) return jsonError("Выберите категорию из списка.");
  if (!validWebUrl(body.imageUrl) || !validWebUrl(body.videoUrl)) return jsonError("Ссылки на медиа должны использовать HTTP или HTTPS.");

  const service = await db.service.create({
    data: {
      sellerId: user.id,
      title,
      description,
      price,
      category: body.category,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
      videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : "",
    },
    include: { seller: { select: { name: true } } },
  });
  return Response.json({ ...service, sellerName: service.seller.name }, { status: 201 });
}
