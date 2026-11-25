import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireRole } from "../../lib/auth";
import { db } from "../../lib/db";

async function AdminGate({ children }: { children: ReactNode }) {
  await requireRole("admin");
  const pendingReports = await db.report.count({ where: { status: "pending" } });
  const links = [
    { href: "/admin", label: "Обзор" },
    { href: "/admin/users", label: "Пользователи" },
    { href: "/admin/orders", label: "Заказы" },
    { href: "/admin/services", label: "Услуги" },
    { href: "/admin/reports", label: "Жалобы", count: pendingReports },
    { href: "/admin/reviews", label: "Отзывы" },
    { href: "/admin/audit", label: "Журнал действий" },
    { href: "/admin/settings", label: "Настройки" },
  ];
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <p className="eyebrow">VIDEOMARKET · ADMIN</p>
      <nav aria-label="Навигация администратора">{links.map((link) => <Link href={link.href} key={link.href}>{link.label}{link.count ? <span className="admin-count">{link.count}</span> : null}</Link>)}</nav>
    </aside>
    <div className="admin-content">{children}</div>
  </div>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="page-shell standard-page"><p>Проверяем права доступа…</p></main>}><AdminGate>{children}</AdminGate></Suspense>;
}
