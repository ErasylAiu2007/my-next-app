"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Point = { date: string; count: number | null };
type AnalyticsData = {
  period: string;
  chartMonthly: boolean;
  trackingStartedAt: string;
  stats: {
    totalUsers: number;
    buyers: number;
    sellers: number;
    newUsers: number;
    activeUsers: number;
    logins: number;
    totalOrders: number;
    newOrders: number;
    completedOrders: number;
    totalServices: number;
    newServices: number;
    totalReports: number;
    newReports: number;
  };
  charts: {
    activity: Point[];
    registrations: Point[];
    orders: Point[];
    logins: Point[];
    roles: { role: string; label: string; count: number }[];
  };
};

const cards = [
  ["totalUsers", "Всего пользователей", "users"],
  ["buyers", "Покупатели", "users"],
  ["sellers", "Продавцы", "users"],
  ["newUsers", "Регистрации за период", "users"],
  ["activeUsers", "Активные за период", "users"],
  ["logins", "Успешные входы за период", "users"],
  ["totalOrders", "Всего заказов", "orders"],
  ["newOrders", "Новые за период", "orders"],
  ["completedOrders", "Завершено за период", "orders"],
  ["totalServices", "Всего услуг", "services"],
  ["newServices", "Новые услуги за период", "services"],
  ["totalReports", "Всего жалоб", "reports"],
  ["newReports", "Новые за период", "reports"],
] as const;

function Chart({ title, points, monthly }: { title: string; points: Point[]; monthly: boolean }) {
  const max = Math.max(1, ...points.map((point) => point.count ?? 0));
  return <section className="analytics-chart">
    <h2>{title}</h2>
    <div className="analytics-bars" role="img" aria-label={title}>
      {points.map((point) => <div className="analytics-bar-column" key={point.date} title={`${point.date}: ${point.count ?? "нет данных"}`}>
        <div className={`analytics-bar-track${point.count === null ? " analytics-bar-unavailable" : ""}`}>
          {point.count !== null ? <span className="analytics-bar" style={{ height: `${Math.max(point.count > 0 ? 4 : 0, point.count / max * 100)}%` }} /> : null}
        </div>
        <small>{new Date(`${point.date}T00:00:00`).toLocaleDateString("ru-RU", monthly ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" })}</small>
      </div>)}
    </div>
  </section>;
}

export function AdminAnalytics() {
  const [period, setPeriod] = useState("7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ period });
    params.set("timezoneOffset", String(new Date().getTimezoneOffset()));
    if (period === "custom" && appliedRange) {
      params.set("from", appliedRange.from);
      params.set("to", appliedRange.to);
    }
    fetch(`/api/admin/analytics?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as AnalyticsData & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Не удалось загрузить аналитику.");
        if (active) { setData(result); setError(""); }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить аналитику.");
      });
    return () => { active = false; };
  }, [period, appliedRange]);

  function choosePeriod(value: string) {
    setPeriod(value);
    setAppliedRange(null);
    setError("");
    if (value === "all") {
      setFrom("");
      setTo("");
    } else {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - Number(value) + 1);
      const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      setFrom(formatDate(startDate));
      setTo(formatDate(endDate));
    }
  }

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setError("Укажите корректный период: дата начала не должна быть позже даты окончания.");
      return;
    }
    setAppliedRange({ from, to });
    setPeriod("custom");
    setError("");
  }

  function resetPeriod() {
    setFrom("");
    setTo("");
    setAppliedRange(null);
    setPeriod("all");
    setError("");
  }

  return <section className="admin-overview-analytics">
    <div className="page-intro"><div><p className="eyebrow">АНАЛИТИКА ПЛАТФОРМЫ</p><h2>Показатели за период</h2><p className="intro-copy">Статистика по реальным данным VideoMarket.</p></div></div>
    <form className="analytics-period" onSubmit={applyRange}>
      <div className="analytics-presets" role="group" aria-label="Быстрый выбор периода">
        {[["1", "Сегодня"], ["7", "7 дней"], ["30", "30 дней"], ["all", "Всё время"]].map(([value, label]) => <button key={value} className={`button ${period === value ? "button-dark" : "button-outline"}`} type="button" aria-pressed={period === value} onClick={() => choosePeriod(value)}>{label}</button>)}
      </div>
      <label className="catalogField"><span>От</span><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
      <label className="catalogField"><span>До</span><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
      <div className="analytics-date-actions"><button className="button button-dark" type="submit">Применить</button><button className="button button-outline" type="button" onClick={resetPeriod}>Сбросить</button></div>
    </form>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {data ? <>
      <p className="analytics-note">Период: {period === "custom" && appliedRange ? `${new Date(`${appliedRange.from}T00:00:00`).toLocaleDateString("ru-RU")} — ${new Date(`${appliedRange.to}T00:00:00`).toLocaleDateString("ru-RU")}` : period === "all" ? "всё время" : period === "1" ? "сегодня" : `${period} дней`}. Данные активности собираются с {new Date(data.trackingStartedAt).toLocaleDateString("ru-RU")}; более ранняя активность не записывалась.</p>
      <div className="admin-stats analytics-stats">{cards.map(([key, label, href]) => {
        const lifetime = href === "users" && ["totalUsers", "buyers", "sellers"].includes(key)
          || href === "orders" && key === "totalOrders"
          || href === "services" && key === "totalServices"
          || href === "reports" && key === "totalReports";
        const periodCount = href === "orders" && key === "newOrders" ? data.stats.newOrders
          : href === "services" && key === "newServices" ? data.stats.newServices
            : href === "reports" && key === "newReports" ? data.stats.newReports
              : data.stats[key];
        const value = new Intl.NumberFormat("ru-RU").format(data.stats[key]);
        const detail = lifetime && (key === "totalOrders" || key === "totalServices" || key === "totalReports")
          ? `За период: ${new Intl.NumberFormat("ru-RU").format(periodCount)}`
          : lifetime ? "За всё время" : "За выбранный период";
        const link = key === "buyers" ? "/admin/users?role=buyer"
          : key === "sellers" ? "/admin/users?role=seller"
            : `/${href === "users" ? "admin/users" : href === "orders" ? "admin/orders" : href === "services" ? "admin/services" : "admin/reports"}`;
        return <Link className="stat-card admin-stat" href={link} key={key}><p>{label}</p><strong>{value}</strong><span>{detail} · Открыть раздел ↗</span></Link>;
      })}</div>
      <div className="analytics-chart-grid">
        <Chart title="Активность пользователей" points={data.charts.activity} monthly={data.chartMonthly} />
        <Chart title="Новые регистрации" points={data.charts.registrations} monthly={data.chartMonthly} />
        <Chart title="Новые заказы" points={data.charts.orders} monthly={data.chartMonthly} />
        <Chart title="Успешные входы" points={data.charts.logins} monthly={data.chartMonthly} />
        <section className="analytics-chart analytics-roles"><h2>Пользователи по ролям</h2>{data.charts.roles.map((item) => {
          const total = data.charts.roles.reduce((sum, role) => sum + role.count, 0) || 1;
          return <div className="analytics-role" key={item.role}><span>{item.label}</span><div className="analytics-role-track"><span style={{ width: `${item.count / total * 100}%` }} /></div><strong>{item.count}</strong></div>;
        })}</section>
      </div>
    </> : !error ? <p>Загружаем аналитику…</p> : null}
  </section>;
}
