"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  serviceTitle: string;
  price: number;
  status: string;
  createdAt: string;
  buyer: { name: string };
  seller: { name: string };
};

const labels: Record<string, string> = {
  pending: "Ожидает подтверждения",
  accepted: "Принят",
  in_progress: "В работе",
  completed: "Завершён",
  cancelled: "Отменён",
};

function dayString(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function OrderBrowser() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/orders").then(async (response) => {
      const data = await response.json() as Order[] | { error?: string };
      if (response.status === 401) {
        router.push("/login?next=%2Forders");
        return;
      }
      if (!response.ok || !Array.isArray(data)) {
        setError("error" in data ? data.error ?? "Не удалось загрузить заказы." : "Не удалось загрузить заказы.");
        return;
      }
      setOrders(data);
    }).catch(() => setError("Не удалось связаться с сервером.")).finally(() => setLoading(false));
  }, [router]);

  const visible = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("ru");
    const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const to = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
    return orders.filter((order) => {
      const created = new Date(order.createdAt);
      const matchesStatus = !status || order.status === status;
      const matchesDate = (!from || created >= from) && (!to || created <= to);
      const matchesSearch = !normalized || [order.id, order.serviceTitle, order.buyer.name, order.seller.name]
        .some((value) => value.toLocaleLowerCase("ru").includes(normalized));
      return matchesStatus && matchesDate && matchesSearch;
    }).sort((left, right) => sort === "newest"
      ? new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      : new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }, [orders, search, status, startDate, endDate, sort]);

  function setRange(range: "today" | "yesterday" | "7" | "30") {
    const today = new Date();
    const start = new Date(today);
    if (range === "yesterday") start.setDate(today.getDate() - 1);
    if (range === "7") start.setDate(today.getDate() - 6);
    if (range === "30") start.setDate(today.getDate() - 29);
    const end = range === "yesterday" ? new Date(start) : today;
    setStartDate(dayString(start));
    setEndDate(dayString(end));
  }

  function reset() {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setSort("newest");
  }

  return <main className="page-shell standard-page">
    <div className="page-intro"><div><p className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p><h1>Заказы</h1><p className="intro-copy">Ваши сделки, актуальные статусы и условия заказов.</p></div></div>
    <section className="order-filters" aria-label="Фильтры заказов">
      <label className="catalogField"><span>Поиск</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, услуга, покупатель или продавец" /></label>
      <label className="catalogField"><span>Статус</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label className="catalogField"><span>С даты</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
      <label className="catalogField"><span>По дату</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      <label className="catalogField"><span>Сортировка</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select></label>
      <div className="order-date-presets">{[["today", "Сегодня"], ["yesterday", "Вчера"], ["7", "7 дней"], ["30", "30 дней"]].map(([range, label]) => <button className="button button-outline" type="button" key={range} onClick={() => setRange(range as "today" | "yesterday" | "7" | "30")}>{label}</button>)}</div>
      <button className="button button-quiet" type="button" onClick={reset}>Сбросить фильтры</button>
    </section>
    <div className="section-title"><h2>Список заказов</h2><p>{loading ? "Загрузка…" : `Найдено: ${visible.length}`}</p></div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {!loading && !error && visible.length === 0 ? <div className="catalogEmpty"><strong>{orders.length ? "Заказы не найдены" : "Заказов пока нет"}</strong><p>{orders.length ? "Измените фильтры или сбросьте поиск." : "Оформленные и полученные вами заказы появятся здесь."}</p></div> : null}
    <div className="order-list">{visible.map((order) => <article className="order-row" key={order.id}>
      <div><strong>{order.serviceTitle}</strong><small>Заказ {order.id} · {new Date(order.createdAt).toLocaleString("ru-RU")}</small></div>
      <div><span className="muted-small">Покупатель / продавец</span><small>{order.buyer.name} / {order.seller.name}</small></div>
      <div><strong>{new Intl.NumberFormat("ru-KZ").format(order.price)} ₸</strong><small className={`status ${order.status === "pending" ? "pending" : order.status === "cancelled" ? "review" : ""}`}>{labels[order.status] ?? order.status}</small></div>
      <Link className="text-link" href={`/orders/${order.id}`}>Открыть →</Link>
    </article>)}</div>
  </main>;
}
