import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

type RouteContext = { params: Promise<{ resource: string }> };
const roles = ["buyer", "seller", "admin"] as const;
const reportStatuses = ["pending", "under_review", "resolved", "rejected"] as const;
const orderStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;
const roleOrder: Record<string, number> = { admin: 0, seller: 1, buyer: 2 };

async function adminForApi() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const admin = await adminForApi();
  if (!admin) return jsonError("Доступ только для администратора.", 403);
  const { resource } = await params;
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const targetType = url.searchParams.get("targetType");
  const reason = url.searchParams.get("reason");
  const category = url.searchParams.get("category");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const sort = url.searchParams.get("sort") ?? "newest";
  const validFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
  const validTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : null;
  const dateFilter = validFrom || validTo ? {
    createdAt: {
      ...(validFrom ? { gte: new Date(`${validFrom}T00:00:00.000Z`) } : {}),
      ...(validTo ? { lte: new Date(`${validTo}T23:59:59.999Z`) } : {}),
    },
  } : {};

  if (resource === "overview") {
    const [totalUsers, buyers, sellers, totalOrders, pendingOrders, totalServices, totalReports, pendingReports] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "buyer" } }),
      db.user.count({ where: { role: "seller" } }),
      db.order.count(),
      db.order.count({ where: { status: "pending" } }),
      db.service.count(),
      db.report.count(),
      db.report.count({ where: { status: "pending" } }),
    ]);
    return Response.json({ totalUsers, buyers, sellers, totalOrders, pendingOrders, totalServices, totalReports, pendingReports });
  }
  if (resource === "users") {
    const users = await db.user.findMany({
      where: {
        ...(query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : {}),
        ...(roles.includes(role as (typeof roles)[number]) ? { role: role as (typeof roles)[number] } : {}),
        ...dateFilter,
      },
      select: { id: true, name: true, email: true, role: true, blocked: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const activities = users.length ? await db.$queryRaw<Array<{ userId: string; createdAt: Date | string }>>`
      SELECT "userId", strftime('%Y-%m-%dT%H:%M:%fZ', MAX("createdAt")) AS "createdAt"
      FROM "AnalyticsEvent" WHERE "userId" IN (${Prisma.join(users.map((user) => user.id))}) GROUP BY "userId"
    ` : [];
    const lastActivity = new Map(activities.map((event) => [event.userId, new Date(event.createdAt).getTime()]));
    const sortedUsers = [...users].sort((a, b) => {
      if (sort === "name-asc" || sort === "name-desc") return a.name.localeCompare(b.name, "ru") * (sort === "name-asc" ? 1 : -1);
      if (sort === "role") return (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || a.name.localeCompare(b.name, "ru");
      if (sort === "active-newest" || sort === "active-oldest") {
        const direction = sort === "active-newest" ? -1 : 1;
        return ((lastActivity.get(a.id) ?? 0) - (lastActivity.get(b.id) ?? 0)) * direction;
      }
      const direction = sort === "oldest" || sort === "age-oldest" || sort === "registration-oldest" ? 1 : -1;
      return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
    }).map((user) => ({
      ...user,
      lastActivityAt: lastActivity.has(user.id) ? new Date(lastActivity.get(user.id)!) : null,
    }));
    return Response.json(sortedUsers);
  }
  if (resource === "services") {
    const services = await db.service.findMany({
      where: {
        ...(query ? { title: { contains: query } } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
        ...(dateFilter),
      },
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const serviceOrders = services.length ? await db.order.findMany({
      where: { serviceId: { in: services.map((service) => service.id) } },
      select: { id: true, serviceId: true },
    }) : [];
    const reviews = serviceOrders.length ? await db.review.findMany({
      where: { hidden: false, orderId: { in: serviceOrders.map((order) => order.id) } },
      select: { orderId: true, rating: true },
    }) : [];
    const serviceByOrder = new Map(serviceOrders.map((order) => [order.id, order.serviceId]));
    const ratings = new Map<string, { total: number; count: number }>();
    for (const review of reviews) {
      const serviceId = serviceByOrder.get(review.orderId);
      if (!serviceId) continue;
      const current = ratings.get(serviceId) ?? { total: 0, count: 0 };
      ratings.set(serviceId, { total: current.total + review.rating, count: current.count + 1 });
    }
    const ratedServices = services.map((service) => ({
      ...service,
      rating: ratings.has(service.id) ? ratings.get(service.id)!.total / ratings.get(service.id)!.count : null,
    }));
    const sortedServices = [...ratedServices].sort((a, b) => {
      if (sort === "name-asc" || sort === "name-desc") return a.title.localeCompare(b.title, "ru") * (sort === "name-asc" ? 1 : -1);
      if (sort === "price-high" || sort === "price-low") return (a.price - b.price) * (sort === "price-high" ? -1 : 1);
      if (sort === "rating-high" || sort === "rating-low") return ((a.rating ?? -1) - (b.rating ?? -1)) * (sort === "rating-high" ? -1 : 1);
      return (a.createdAt.getTime() - b.createdAt.getTime()) * (sort === "oldest" ? 1 : -1);
    });
    return Response.json(sortedServices);
  }
  if (resource === "orders") {
    const orders = await db.order.findMany({
      where: {
        ...(query ? {
          OR: [
            { id: { contains: query } },
            { serviceTitle: { contains: query } },
            { buyer: { name: { contains: query } } },
            { seller: { name: { contains: query } } },
          ],
        } : {}),
        ...(orderStatuses.includes(status as (typeof orderStatuses)[number]) ? { status: status as (typeof orderStatuses)[number] } : {}),
        ...dateFilter,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const statusRank: Record<string, number> = { pending: 0, accepted: 1, in_progress: 2, completed: 3, cancelled: 4 };
    const sortedOrders = [...orders].sort((a, b) => {
      if (sort === "price-high" || sort === "price-low") return (a.price - b.price) * (sort === "price-high" ? -1 : 1);
      if (sort === "status") return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (sort === "buyer-asc" || sort === "buyer-desc") {
        return a.buyer.name.localeCompare(b.buyer.name, "ru") * (sort === "buyer-asc" ? 1 : -1);
      }
      return (a.createdAt.getTime() - b.createdAt.getTime()) * (sort === "oldest" ? 1 : -1);
    });
    return Response.json(sortedOrders);
  }
  if (resource === "reports") {
    const reports = await db.report.findMany({
      where: {
        ...(status && reportStatuses.includes(status as (typeof reportStatuses)[number]) ? { status: status as (typeof reportStatuses)[number] } : {}),
        ...(targetType === "service" || targetType === "order" ? { targetType } : {}),
        ...(reason ? { reason } : {}),
        ...dateFilter,
        ...(query ? { OR: [{ targetId: { contains: query } }, { reporter: { name: { contains: query } } }, { reason: { contains: query } }] } : {}),
      },
      include: { reporter: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    const sortedReports = [...reports].sort((a, b) => {
      if (sort === "status") return a.status.localeCompare(b.status, "ru");
      if (sort === "reason") return a.reason.localeCompare(b.reason, "ru");
      return (a.createdAt.getTime() - b.createdAt.getTime()) * (sort === "oldest" ? 1 : -1);
    });
    const withTargets = await Promise.all(sortedReports.map(async (report) => {
      const target = report.targetType === "service"
        ? await db.service.findUnique({
          where: { id: report.targetId },
          select: { title: true, status: true, description: true, seller: { select: { id: true, name: true, email: true } } },
        })
        : await db.order.findUnique({
          where: { id: report.targetId },
          select: {
            serviceTitle: true,
            status: true,
            price: true,
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
          },
        });
      return { ...report, target };
    }));
    return Response.json(withTargets);
  }
  if (resource === "reviews") {
    const hidden = url.searchParams.get("hidden");
    const reviews = await db.review.findMany({
      where: {
        ...(hidden === "visible" ? { hidden: false } : {}),
        ...(hidden === "hidden" ? { hidden: true } : {}),
        ...(query ? { OR: [{ comment: { contains: query } }, { category: { contains: query } }, { buyer: { name: { contains: query } } }, { seller: { name: { contains: query } } }] } : {}),
        ...dateFilter,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" }, take: 300,
    });
    const sortedReviews = [...reviews].sort((a, b) => {
      if (sort === "rating-high" || sort === "rating-low") return (a.rating - b.rating) * (sort === "rating-high" ? -1 : 1);
      if (sort === "buyer-asc" || sort === "buyer-desc") return a.buyer.name.localeCompare(b.buyer.name, "ru") * (sort === "buyer-asc" ? 1 : -1);
      return (a.createdAt.getTime() - b.createdAt.getTime()) * (sort === "oldest" ? 1 : -1);
    });
    return Response.json(sortedReviews);
  }
  if (resource === "audit") {
    const logs = await db.moderationLog.findMany({
      where: query ? { OR: [
        { action: { contains: query } },
        { targetType: { contains: query } },
        { targetId: { contains: query } },
        { details: { contains: query } },
        { admin: { name: { contains: query } } },
      ] } : {},
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    const sortedLogs = [...logs].sort((a, b) => {
      if (sort === "action") return a.action.localeCompare(b.action, "ru");
      if (sort === "admin") return a.admin.name.localeCompare(b.admin.name, "ru");
      return (a.createdAt.getTime() - b.createdAt.getTime()) * (sort === "oldest" ? 1 : -1);
    });
    return Response.json(sortedLogs);
  }
  return jsonError("Раздел не найден.", 404);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const admin = await adminForApi();
  if (!admin) return jsonError("Доступ только для администратора.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте данные действия.");
  }
  if (!isRecord(body) || typeof body.id !== "string" || typeof body.action !== "string") return jsonError("Проверьте данные действия.");
  const { resource } = await params;
  let id = body.id;
  let actionLabel = "";
  let targetType = resource;
  let details = "";

  if (resource === "users") {
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true, blocked: true } });
    if (!target) return jsonError("Пользователь не найден.", 404);
    if (target.id === admin.id && (body.action === "block" || body.role !== undefined && body.role !== "admin")) {
      return jsonError("Нельзя заблокировать или лишить роли администратора собственный аккаунт.", 409);
    }
    if (body.action === "role" && roles.includes(body.role as (typeof roles)[number])) {
      if (target.role === "admin" && body.role !== "admin" && await db.user.count({ where: { role: "admin", blocked: false } }) <= 1) {
        return jsonError("Нельзя снять роль у последнего активного администратора.", 409);
      }
      await db.user.update({ where: { id }, data: { role: body.role as (typeof roles)[number] } });
      actionLabel = "Изменение роли пользователя";
      details = `Новая роль: ${body.role}`;
    } else if (body.action === "block" || body.action === "unblock") {
      await db.user.update({ where: { id }, data: { blocked: body.action === "block" } });
      actionLabel = body.action === "block" ? "Блокировка пользователя" : "Разблокировка пользователя";
    } else return jsonError("Недопустимое действие с пользователем.");
  } else if (resource === "services") {
    const target = await db.service.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!target) return jsonError("Услуга не найдена.", 404);
    if (body.action === "hide" || body.action === "restore") {
      await db.service.update({ where: { id }, data: { status: body.action === "hide" ? "hidden" : "published" } });
      actionLabel = body.action === "hide" ? "Скрытие услуги" : "Восстановление услуги";
    } else return jsonError("Недопустимое действие с услугой.");
  } else if (resource === "orders") {
    const target = await db.order.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!target) return jsonError("Заказ не найден.", 404);
    if (body.action === "cancel") {
      await db.order.update({ where: { id }, data: { status: "cancelled" } });
      actionLabel = "Отмена заказа администратором";
    } else if (body.action === "status" && typeof body.status === "string" && orderStatuses.includes(body.status as (typeof orderStatuses)[number])) {
      await db.order.update({ where: { id }, data: { status: body.status as (typeof orderStatuses)[number] } });
      actionLabel = "Изменение статуса заказа администратором";
      details = `Новый статус: ${body.status}`;
    } else return jsonError("Недопустимое действие с заказом.");
  } else if (resource === "reviews") {
    const target = await db.review.findUnique({ where: { id }, select: { id: true, hidden: true } });
    if (!target) return jsonError("Отзыв не найден.", 404);
    if (body.action !== "hide" && body.action !== "restore") return jsonError("Недопустимое действие с отзывом.");
    await db.review.update({ where: { id }, data: { hidden: body.action === "hide" } });
    actionLabel = body.action === "hide" ? "Скрытие некорректного отзыва" : "Восстановление отзыва";
    targetType = "review";
  } else if (resource === "reports") {
    const target = await db.report.findUnique({ where: { id }, select: { id: true, targetType: true, targetId: true } });
    if (!target) return jsonError("Жалоба не найдена.", 404);
    if (body.action === "status" && typeof body.status === "string" && reportStatuses.includes(body.status as (typeof reportStatuses)[number])) {
      await db.report.update({
        where: { id },
        data: {
          status: body.status as (typeof reportStatuses)[number],
          ...(typeof body.adminNotes === "string" ? { adminNotes: body.adminNotes.slice(0, 3000) } : {}),
        },
      });
      actionLabel = "Изменение статуса жалобы";
      targetType = "report";
      details = `Статус: ${body.status}`;
    } else if (body.action === "hide_service" && target.targetType === "service") {
      await db.service.update({ where: { id: target.targetId }, data: { status: "hidden" } });
      actionLabel = "Скрытие услуги по жалобе";
      targetType = "service";
      id = target.targetId;
    } else if (body.action === "cancel_order" && target.targetType === "order") {
      await db.order.update({ where: { id: target.targetId }, data: { status: "cancelled" } });
      actionLabel = "Отмена заказа по жалобе";
      targetType = "order";
      id = target.targetId;
    } else if (body.action === "block_seller" && typeof body.adminNotes === "string" && body.adminNotes.trim().length >= 10) {
      const sellerId = target.targetType === "service"
        ? (await db.service.findUnique({ where: { id: target.targetId }, select: { sellerId: true } }))?.sellerId
        : (await db.order.findUnique({ where: { id: target.targetId }, select: { sellerId: true } }))?.sellerId;
      if (!sellerId) return jsonError("Продавец не найден.", 404);
      if (sellerId === admin.id) return jsonError("Нельзя заблокировать собственный аккаунт.", 409);
      await db.user.update({ where: { id: sellerId }, data: { blocked: true } });
      await db.report.update({ where: { id }, data: { adminNotes: body.adminNotes.trim().slice(0, 3000) } });
      actionLabel = "Блокировка продавца по жалобе";
      targetType = "user";
      id = sellerId;
      details = body.adminNotes.trim().slice(0, 3000);
    } else return jsonError("Недопустимое действие с жалобой.");
  } else return jsonError("Раздел не найден.", 404);

  await db.moderationLog.create({
    data: { adminId: admin.id, action: actionLabel, targetType, targetId: id, details },
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const admin = await adminForApi();
  if (!admin) return jsonError("Доступ только для администратора.", 403);
  const { resource } = await params;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Не указан объект для удаления.");
  let label = "";
  if (resource === "services") {
    const target = await db.service.findUnique({ where: { id }, select: { id: true } });
    if (!target) return jsonError("Услуга не найдена.", 404);
    await db.service.delete({ where: { id } });
    label = "Удаление услуги";
  } else if (resource === "orders") {
    const target = await db.order.findUnique({ where: { id }, select: { id: true } });
    if (!target) return jsonError("Заказ не найден.", 404);
    await db.order.delete({ where: { id } });
    label = "Удаление заказа";
  } else return jsonError("Этот объект нельзя удалить.");
  await db.moderationLog.create({ data: { adminId: admin.id, action: label, targetType: resource.slice(0, -1), targetId: id } });
  return Response.json({ ok: true });
}
