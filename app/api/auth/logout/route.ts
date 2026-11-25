import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { isSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const cookieStore = await cookies();
  await deleteSession(cookieStore.get(sessionCookieName)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
