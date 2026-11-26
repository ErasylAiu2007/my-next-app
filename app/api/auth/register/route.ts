import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession, hashPassword, recordAnalyticsEvent, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecord, isSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Проверьте данные формы.");
  }
  if (!isRecord(body)) return jsonError("Проверьте данные формы.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (name.length < 2 || name.length > 80) return jsonError("Имя должно содержать от 2 до 80 символов.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return jsonError("Введите корректный адрес электронной почты.");
  if (password.length < 10 || password.length > 128) return jsonError("Пароль должен содержать от 10 до 128 символов.");
  if (role !== "buyer" && role !== "seller") return jsonError("Выберите роль покупателя или продавца.");

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return jsonError("Аккаунт с такой электронной почтой уже существует.", 409);

  let user;
  try {
    user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role },
      select: { id: true, name: true, email: true, role: true, blocked: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Аккаунт с такой электронной почтой уже существует.", 409);
    }
    throw error;
  }
  const token = await createSession(user.id);
  await recordAnalyticsEvent(user.id, "activity");
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set(sessionCookieName, token, sessionCookieOptions());
  return response;
}
