"use client";

import { AdminAnalytics } from "./admin-analytics";

export function AdminDashboard() {
  return <main className="admin-page">
    <div className="page-intro"><div><p className="eyebrow">УПРАВЛЕНИЕ ПЛАТФОРМОЙ</p><h1>Панель администратора</h1><p className="intro-copy">Основные показатели VideoMarket и быстрый переход к управлению.</p></div></div>
    <AdminAnalytics />
  </main>;
}
