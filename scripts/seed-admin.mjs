import "dotenv/config";
import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(nodeScrypt);
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Администратор";

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Укажите корректный ADMIN_EMAIL в локальном .env.");
}
if (!password || password.length < 16 || password.length > 128) {
  throw new Error("ADMIN_PASSWORD должен содержать от 16 до 128 символов.");
}

const salt = randomBytes(16).toString("hex");
const key = await scrypt(password, salt, 64);
const passwordHash = `scrypt:${salt}:${key.toString("hex")}`;
const prisma = new PrismaClient();

try {
  await prisma.user.upsert({
    where: { email },
    create: { name, email, passwordHash, role: "admin" },
    update: { name, passwordHash, role: "admin", blocked: false },
  });
  console.info("Администратор создан или обновлён. Пароль не выводится.");
} finally {
  await prisma.$disconnect();
}
