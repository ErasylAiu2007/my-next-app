import { NextResponse } from "next/server";
import { createSession, recordAnalyticsEvent, sessionCookieName, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте адрес электронной почты и пароль.");
  }
  if (!isRecord(body) || typeof body.email !== "string" || body.email.length > 254 || typeof body.password !== "string" || body.password.length < 1 || body.password.length > 128) {
    return jsonError("Проверьте адрес электронной почты и пароль.");
  }

  const user = await db.user.findUnique({ where: { email: body.email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return jsonError("Неверная электронная почта или пароль.", 401);
  }
  if (user.blocked) return jsonError("Аккаунт заблокирован. Обратитесь в службу поддержки.", 403);

  const token = await createSession(user.id);
  await recordAnalyticsEvent(user.id, "login");
  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  response.cookies.set(sessionCookieName, token, sessionCookieOptions());
  return response;
}
