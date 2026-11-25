"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Resource = "users" | "orders" | "services" | "reports" | "reviews" | "audit";
type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const titles: Record<Resource, string> = {
  users: "Пользователи",
  orders: "Заказы",
  services: "Услуги",
  reports: "Жалобы",
  reviews: "Отзывы",
  audit: "Журнал действий",
};
const roles: Record<string, string> = { buyer: "Покупатель", seller: "Продавец", admin: "Администратор" };
const orderStatuses: Record<string, string> = { pending: "Ожидает", accepted: "Принят", in_progress: "В работе", completed: "Завершён", cancelled: "Отменён" };
const reportStatuses: Record<string, string> = { pending: "Новая", under_review: "На рассмотрении", resolved: "Решена", rejected: "Отклонена" };
const reportReasons = ["Оскорбления и мат", "Мошенничество", "Спам", "Недостоверная информация", "Запрещённый контент", "Проблема с заказом", "Другое"];
const categories = ["Видеомонтаж", "Съёмка", "Анимация", "Реклама", "Цветокоррекция"];

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function nested(row: Row, key: string, field: string): string {
  return nestedValue(row[key], field);
}
function nestedValue(value: unknown, field: string): string {
  return isRow(value) ? text(value[field]) : "";
}
function date(value: unknown) {
  return value ? new Date(String(value)).toLocaleString("ru-RU") : "—";
}

export function AdminResource({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [hidden, setHidden] = useState("");
  const [sort, setSort] = useState("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (targetType) params.set("targetType", targetType);
    if (reason) params.set("reason", reason);
    if (category) params.set("category", category);
    if (hidden) params.set("hidden", hidden);
    if (sort === "oldest") params.set("sort", sort);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const response = await fetch(`/api/admin/${resource}?${params.toString()}`);
      const data = await response.json() as Row[] | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        setError(!Array.isArray(data) ? data.error ?? "Не удалось загрузить список." : "Не удалось загрузить список.");
        setRows([]);
      } else setRows(data);
    } catch {
      setError("Не удалось связаться с сервером.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource, query, role, status, targetType, reason, category, hidden, from, to, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function mutate(url: string, method: "PATCH" | "DELETE", body?: Row, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Действие не выполнено.");
        return;
      }
      setNotice("Изменения сохранены.");
      await load();
    } catch {
      setError("Не удалось связаться с сервером.");
    }
  }

  function filters() {
    return <div className="admin-filters">
      <label className="catalogField"><span>Поиск</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по списку" /></label>
      {resource === "users" ? <label className="catalogField"><span>Роль</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="">Все роли</option>{Object.entries(roles).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label> : null}
      {resource === "services" ? <>
        <label className="catalogField"><span>Категория</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Все категории</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label className="catalogField"><span>Статус</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option><option value="published">Опубликована</option><option value="hidden">Скрыта</option><option value="draft">Черновик</option></select></label>
      </> : null}
      {resource === "orders" ? <label className="catalogField"><span>Статус</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{Object.entries(orderStatuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label> : null}
      {resource === "orders" ? <label className="catalogField"><span>Сортировка</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select></label> : null}
      {resource === "reviews" ? <label className="catalogField"><span>Статус</span><select value={hidden} onChange={(event) => setHidden(event.target.value)}><option value="">Все отзывы</option><option value="visible">Видимые</option><option value="hidden">Скрытые</option></select></label> : null}
      {resource === "reports" ? <>
        <label className="catalogField"><span>Статус</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{Object.entries(reportStatuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label className="catalogField"><span>Тип объекта</span><select value={targetType} onChange={(event) => setTargetType(event.target.value)}><option value="">Все типы</option><option value="service">Услуга</option><option value="order">Заказ</option></select></label>
        <label className="catalogField"><span>Причина</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option value="">Все причины</option>{reportReasons.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </> : null}
      {resource !== "audit" ? <><label className="catalogField"><span>С даты</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="catalogField"><span>По дату</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></> : null}
    </div>;
  }

  function rowActions(row: Row) {
    const id = text(row.id);
    if (resource === "users") return <div className="admin-actions">
      <select aria-label={`Изменить роль ${text(row.name)}`} value={text(row.role)} onChange={(event) => void mutate(`/api/admin/users`, "PATCH", { id, action: "role", role: event.target.value })}>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button className="button button-outline" type="button" onClick={() => void mutate("/api/admin/users", "PATCH", { id, action: row.blocked ? "unblock" : "block" }, row.blocked ? "Разблокировать пользователя?" : "Заблокировать пользователя?")}>{row.blocked ? "Разблокировать" : "Заблокировать"}</button>
    </div>;
    if (resource === "services") return <div className="admin-actions">
      <button className="button button-outline" type="button" onClick={() => void mutate("/api/admin/services", "PATCH", { id, action: row.status === "hidden" ? "restore" : "hide" }, row.status === "hidden" ? "Восстановить услугу?" : "Скрыть услугу?")}>{row.status === "hidden" ? "Восстановить" : "Скрыть"}</button>
      <button className="button button-outline" type="button" onClick={() => void mutate(`/api/admin/services?id=${encodeURIComponent(id)}`, "DELETE", undefined, "Удалить услугу без возможности восстановления?")}>Удалить</button>
    </div>;
    if (resource === "orders") return <div className="admin-actions">
      <Link className="button button-quiet" href={`/orders/${id}`}>Подробнее</Link>
      {row.status !== "cancelled" ? <button className="button button-outline" type="button" onClick={() => void mutate("/api/admin/orders", "PATCH", { id, action: "cancel" }, "Отменить заказ?")}>Отменить</button> : null}
      <button className="button button-outline" type="button" onClick={() => void mutate(`/api/admin/orders?id=${encodeURIComponent(id)}`, "DELETE", undefined, "Удалить заказ и его карточку?")}>Удалить</button>
    </div>;
    if (resource === "reports") return <ReportActions row={row} onMutate={mutate} />;
    if (resource === "reviews") return <div className="admin-actions">
      <button className="button button-outline" type="button" onClick={() => void mutate("/api/admin/reviews", "PATCH", { id, action: row.hidden ? "restore" : "hide" }, row.hidden ? "Показать отзыв?" : "Скрыть этот отзыв?")}>{row.hidden ? "Показать" : "Скрыть"}</button>
    </div>;
    return <span>{text(row.details)}</span>;
  }

  return <main className="admin-page">
    <div className="page-intro"><div><p className="eyebrow">АДМИНИСТРИРОВАНИЕ</p><h1>{titles[resource]}</h1><p className="intro-copy">{loading ? "Загрузка…" : `Записей: ${rows.length}`}</p></div></div>
    {filters()}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {notice ? <p className="form-success" role="status">{notice}</p> : null}
    {!loading && rows.length === 0 && !error ? <div className="catalogEmpty"><strong>Ничего не найдено</strong><p>Попробуйте изменить фильтры.</p></div> : null}
    <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr>{resource === "users" ? <><th>Пользователь</th><th>Роль</th><th>Статус</th><th>Регистрация</th><th>Действия</th></> : null}
        {resource === "services" ? <><th>Услуга</th><th>Продавец</th><th>Категория / цена</th><th>Дата</th><th>Статус / действия</th></> : null}
        {resource === "orders" ? <><th>Заказ</th><th>Участники</th><th>Сумма</th><th>Статус / дата</th><th>Действия</th></> : null}
        {resource === "reports" ? <><th>ID / дата</th><th>Автор жалобы</th><th>Объект / тип</th><th>Причина / статус</th><th>Описание и действия</th></> : null}
        {resource === "reviews" ? <><th>Покупатель</th><th>Продавец</th><th>Категория / оценка</th><th>Отзыв</th><th>Действия</th></> : null}
        {resource === "audit" ? <><th>Дата</th><th>Администратор</th><th>Действие</th><th>Объект</th><th>Подробности</th></> : null}
      </tr></thead>
      <tbody>{rows.map((row) => <tr key={text(row.id)}>
        {resource === "users" ? <><td><strong>{text(row.name)}</strong><small>{text(row.email)}</small></td><td>{roles[text(row.role)] ?? text(row.role)}</td><td>{row.blocked ? "Заблокирован" : "Активен"}</td><td>{date(row.createdAt)}</td><td>{rowActions(row)}</td></> : null}
        {resource === "services" ? <><td><strong>{text(row.title)}</strong><small>{text(row.id)}</small></td><td>{nested(row, "seller", "name")}<small>{nested(row, "seller", "email")}</small></td><td>{text(row.category)} · {new Intl.NumberFormat("ru-KZ").format(Number(row.price))} ₸</td><td>{date(row.createdAt)}</td><td>{rowActions(row)}</td></> : null}
        {resource === "orders" ? <><td><strong>{text(row.serviceTitle)}</strong><small>{text(row.id)}</small></td><td>{nested(row, "buyer", "name")} → {nested(row, "seller", "name")}</td><td>{new Intl.NumberFormat("ru-KZ").format(Number(row.price))} ₸</td><td>{orderStatuses[text(row.status)] ?? text(row.status)}<small>{date(row.createdAt)}</small></td><td>{rowActions(row)}</td></> : null}
        {resource === "reports" ? <><td>{text(row.id)}<small>{date(row.createdAt)}</small></td><td>{nested(row, "reporter", "name")}<small>{nested(row, "reporter", "email")}</small></td><td>{row.targetType === "service" ? nested(row, "target", "title") : nested(row, "target", "serviceTitle")}<small>{row.targetType === "service" ? "Услуга" : "Заказ"} · {nested(row, "target", "status")}</small><Link className="text-link" href={row.targetType === "service" ? `/service/${text(row.targetId)}` : `/orders/${text(row.targetId)}`}>Открыть объект ↗</Link></td><td>{text(row.reason)}<small>{reportStatuses[text(row.status)] ?? text(row.status)}</small></td><td><details><summary>Детали и действия</summary><p>{text(row.description) || "Описание не добавлено."}</p><p>{row.targetType === "service" ? `Продавец: ${nestedValue(isRow(row.target) ? row.target.seller : null, "name")}` : `Покупатель: ${nestedValue(isRow(row.target) ? row.target.buyer : null, "name")} · Продавец: ${nestedValue(isRow(row.target) ? row.target.seller : null, "name")}`}</p><ReportNotes row={row} onMutate={mutate} />{rowActions(row)}</details></td></> : null}
        {resource === "reviews" ? <><td>{nested(row, "buyer", "name")}<small>{nested(row, "buyer", "email")}</small></td><td>{nested(row, "seller", "name")}<small>{nested(row, "seller", "email")}</small></td><td>{text(row.category)}<small>{text(row.rating)} ★ · {row.hidden ? "Скрыт" : "Виден"}</small></td><td>{text(row.comment) || "Без комментария."}<small>{date(row.createdAt)}</small></td><td>{rowActions(row)}</td></> : null}
        {resource === "audit" ? <><td>{date(row.createdAt)}</td><td>{nested(row, "admin", "name")}</td><td>{text(row.action)}</td><td>{text(row.targetType)} · {text(row.targetId)}</td><td>{text(row.details) || "—"}</td></> : null}
      </tr>)}</tbody>
    </table></div>
  </main>;
}

function ReportNotes({ row, onMutate }: { row: Row; onMutate: (url: string, method: "PATCH" | "DELETE", body?: Row, confirmText?: string) => Promise<void> }) {
  const [notes, setNotes] = useState(text(row.adminNotes));
  return <label className="catalogField"><span>Внутренние заметки</span><textarea rows={2} maxLength={3000} value={notes} onChange={(event) => setNotes(event.target.value)} /><button className="button button-outline" type="button" onClick={() => void onMutate("/api/admin/reports", "PATCH", { id: text(row.id), action: "status", status: text(row.status), adminNotes: notes })}>Сохранить заметку</button></label>;
}

function ReportActions({ row, onMutate }: { row: Row; onMutate: (url: string, method: "PATCH" | "DELETE", body?: Row, confirmText?: string) => Promise<void> }) {
  const id = text(row.id);
  return <div className="admin-actions">
    <select aria-label="Изменить статус жалобы" value={text(row.status)} onChange={(event) => void onMutate("/api/admin/reports", "PATCH", { id, action: "status", status: event.target.value, adminNotes: text(row.adminNotes) })}>
      {Object.entries(reportStatuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
    </select>
    {row.targetType === "service" ? <>
      <button className="button button-outline" type="button" onClick={() => void onMutate("/api/admin/reports", "PATCH", { id, action: "hide_service" }, "Скрыть услугу по этой жалобе?")}>Скрыть услугу</button>
      <button className="button button-outline" type="button" onClick={() => void onMutate("/api/admin/reports", "PATCH", { id, action: "block_seller", adminNotes: window.prompt("Укажите основание блокировки (не менее 10 символов):") ?? "" }, "Заблокировать продавца?")}>Заблокировать продавца</button>
    </> : <button className="button button-outline" type="button" onClick={() => void onMutate("/api/admin/reports", "PATCH", { id, action: "cancel_order" }, "Отменить заказ по этой жалобе?")}>Отменить заказ</button>}
  </div>;
}
