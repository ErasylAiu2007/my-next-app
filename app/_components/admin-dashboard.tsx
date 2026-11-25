"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  buyers: number;
  sellers: number;
  totalOrders: number;
  pendingOrders: number;
  totalServices: number;
  totalReports: number;
  pendingReports: number;
};

const cards: { key: keyof Stats; label: string; href: string }[] = [
  { key: "totalUsers", label: "Всего пользователей", href: "/admin/users" },
  { key: "buyers", label: "Покупатели", href: "/admin/users?role=buyer" },
  { key: "sellers", label: "Продавцы", href: "/admin/users?role=seller" },
  { key: "totalOrders", label: "Всего заказов", href: "/admin/orders" },
  { key: "pendingOrders", label: "Ожидают подтверждения", href: "/admin/orders?status=pending" },
  { key: "totalServices", label: "Всего услуг", href: "/admin/services" },
  { key: "totalReports", label: "Всего жалоб", href: "/admin/reports" },
  { key: "pendingReports", label: "Новые жалобы", href: "/admin/reports?status=pending" },
];

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/overview").then(async (response) => {
      const data = await response.json() as Stats & { error?: string };
      if (!response.ok) setError(data.error ?? "Не удалось загрузить показатели.");
      else setStats(data);
    }).catch(() => setError("Не удалось связаться с сервером."));
  }, []);

  return <main className="admin-page">
    <div className="page-intro"><div><p className="eyebrow">УПРАВЛЕНИЕ ПЛАТФОРМОЙ</p><h1>Панель администратора</h1><p className="intro-copy">Основные показатели VideoMarket и быстрый переход к управлению.</p></div></div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="admin-stats">{cards.map((card) => <Link className="stat-card admin-stat" href={card.href} key={card.key}><p>{card.label}</p><strong>{stats ? new Intl.NumberFormat("ru-RU").format(stats[card.key]) : "…"}</strong><span>Открыть раздел ↗</span></Link>)}</div>
  </main>;
}
