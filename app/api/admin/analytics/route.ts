import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";

type EventRow = { userId: string; eventType: string; createdAt: Date | string };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return jsonError("Доступ только для администратора.", 403);

  const url = new URL(request.url);
  const requestedPeriod = url.searchParams.get("period");
  const period = requestedPeriod === "all" ? "all" : requestedPeriod === "custom" ? "custom" : requestedPeriod === "7" || requestedPeriod === "30" ? requestedPeriod : "1";
  const now = new Date();
  const parsedOffset = Number(url.searchParams.get("timezoneOffset"));
  const timezoneOffset = Number.isInteger(parsedOffset) && Math.abs(parsedOffset) <= 14 * 60 ? parsedOffset : 0;
  const localNow = new Date(now.getTime() - timezoneOffset * 60 * 1000);
  let start: Date | null;
  let end = now;
  if (period === "custom") {
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
      return jsonError("Укажите корректные даты начала и окончания периода.");
    }
    const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
    const [toYear, toMonth, toDay] = to.split("-").map(Number);
    start = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay) + timezoneOffset * 60 * 1000);
    end = new Date(Date.UTC(toYear, toMonth - 1, toDay + 1) + timezoneOffset * 60 * 1000 - 1);
    if (start > now) return jsonError("Дата начала не может быть в будущем.");
    if (end > now) end = now;
  } else {
    const days = period === "all" ? null : Number(period);
    start = days === null ? null : new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() - days + 1) + timezoneOffset * 60 * 1000);
  }
  const [tracking] = await db.$queryRaw<Array<{ startedAt: Date | string }>>`
    SELECT strftime('%Y-%m-%dT%H:%M:%fZ', "startedAt") AS "startedAt" FROM "AnalyticsTracking" WHERE "id" = 'global'
  `;
  if (!tracking) return jsonError("Не настроена дата начала сбора аналитики.", 500);
  const trackingStartedAt = new Date(tracking.startedAt);
  const activityStart = start && trackingStartedAt > start ? trackingStartedAt : start ?? trackingStartedAt;
  const selectedDateFilter = { ...(start ? { gte: start } : {}), lte: end };

  const [totalUsers, buyers, sellers, totalOrders, totalServices, totalReports, newUsers, activeEvents, logins, newOrders, completedOrders, newServices, newReports, roleCounts] = await Promise.all([
    db.user.count({ where: { createdAt: { lte: now } } }),
    db.user.count({ where: { role: "buyer", createdAt: { lte: now } } }),
    db.user.count({ where: { role: "seller", createdAt: { lte: now } } }),
    db.order.count({ where: { createdAt: { lte: now } } }),
    db.service.count({ where: { createdAt: { lte: now } } }),
    db.report.count({ where: { createdAt: { lte: now } } }),
    db.user.findMany({ where: { createdAt: selectedDateFilter }, select: { createdAt: true } }),
    db.$queryRaw<Array<EventRow>>`
      SELECT "userId", "eventType", strftime('%Y-%m-%dT%H:%M:%fZ', "createdAt") AS "createdAt" FROM "AnalyticsEvent"
      WHERE "eventType" IN ('login', 'activity') AND "createdAt" >= ${activityStart} AND "createdAt" <= ${end}
    `,
    db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS "count" FROM "AnalyticsEvent"
      WHERE "eventType" = 'login' AND "createdAt" >= ${activityStart} AND "createdAt" <= ${end}
    `,
    db.order.findMany({ where: { createdAt: selectedDateFilter }, select: { createdAt: true } }),
    db.order.count({ where: { status: "completed", updatedAt: selectedDateFilter } }),
    db.service.findMany({ where: { status: "published", createdAt: selectedDateFilter }, select: { createdAt: true } }),
    db.report.findMany({ where: { createdAt: selectedDateFilter }, select: { createdAt: true } }),
    db.user.groupBy({ by: ["role"], where: { createdAt: selectedDateFilter }, _count: { _all: true } }),
  ]);
  const loginCount = Number(logins[0]?.count ?? 0);

  const earliestRecord = [trackingStartedAt, ...newUsers.map((row) => row.createdAt), ...newOrders.map((row) => row.createdAt)]
    .reduce((first, date) => date < first ? date : first, end);
  const chartBase = start ?? earliestRecord;
  const chartMonthly = period === "all" || end.getTime() - chartBase.getTime() > 90 * 24 * 60 * 60 * 1000;
  const chartStart = chartMonthly
    ? new Date(Date.UTC(chartBase.getUTCFullYear(), chartBase.getUTCMonth(), 1))
    : new Date(Date.UTC(chartBase.getUTCFullYear(), chartBase.getUTCMonth(), chartBase.getUTCDate()));
  const chartEnd = chartMonthly
    ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const chartLength = chartMonthly
    ? (chartEnd.getUTCFullYear() - chartStart.getUTCFullYear()) * 12 + chartEnd.getUTCMonth() - chartStart.getUTCMonth() + 1
    : Math.floor((chartEnd.getTime() - chartStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const dayKeys = Array.from({ length: Math.max(1, chartLength) }, (_, index) => {
    const date = chartMonthly
      ? new Date(Date.UTC(chartStart.getUTCFullYear(), chartStart.getUTCMonth() + index, 1))
      : new Date(chartStart.getTime() + index * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
  const chartKey = (date: Date) => {
    const isoDate = date.toISOString().slice(0, 10);
    return chartMonthly ? `${isoDate.slice(0, 7)}-01` : isoDate;
  };
  const dailyUsers = new Map<string, Set<string>>();
  const dailyLogins = new Map<string, number>();
  const groupDates = (dates: Date[]) => {
    const counts = new Map<string, number>();
    for (const date of dates) {
      const key = chartKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  };
  for (const event of activeEvents) {
    const eventDate = new Date(event.createdAt);
    const key = chartKey(eventDate);
    const users = dailyUsers.get(key) ?? new Set<string>();
    users.add(event.userId);
    dailyUsers.set(key, users);
    if (event.eventType === "login") dailyLogins.set(key, (dailyLogins.get(key) ?? 0) + 1);
  }
  const daily = (counts: Map<string, number>, activityOnly = false) => dayKeys.map((date) => ({
    date,
    count: activityOnly && trackingStartedAt > bucketEnd(date, chartMonthly) ? null : counts.get(date) ?? 0,
  }));
  const roleCountsByName = new Map(roleCounts.map((entry) => [entry.role, entry._count._all]));

  return Response.json({
    period,
    chartMonthly,
    trackingStartedAt,
    stats: {
      totalUsers,
      buyers,
      sellers,
      newUsers: newUsers.length,
      activeUsers: new Set(activeEvents.map((event) => event.userId)).size,
      logins: loginCount,
      totalOrders,
      newOrders: newOrders.length,
      completedOrders,
      totalServices,
      newServices: newServices.length,
      totalReports,
      newReports: newReports.length,
    },
    charts: {
      activity: dayKeys.map((date) => ({
        date,
        count: trackingStartedAt > bucketEnd(date, chartMonthly) ? null : dailyUsers.get(date)?.size ?? 0,
      })),
      registrations: daily(groupDates(newUsers.map((row) => row.createdAt))),
      orders: daily(groupDates(newOrders.map((row) => row.createdAt))),
      logins: daily(dailyLogins, true),
      roles: [
        { role: "buyer", label: "Покупатели", count: roleCountsByName.get("buyer") ?? 0 },
        { role: "seller", label: "Продавцы", count: roleCountsByName.get("seller") ?? 0 },
        { role: "admin", label: "Администраторы", count: roleCountsByName.get("admin") ?? 0 },
      ],
    },
  });
}

function bucketEnd(date: string, monthly: boolean): Date {
  const [year, month, day] = date.split("-").map(Number);
  return monthly
    ? new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
