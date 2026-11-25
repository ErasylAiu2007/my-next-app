import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "../../_components/order-actions";
import { requireUser } from "../../../lib/auth";
import { db } from "../../../lib/db";

const statusNames: Record<string, string> = {
  pending: "Ожидает подтверждения",
  accepted: "Принят продавцом",
  in_progress: "В работе",
  completed: "Завершён",
  cancelled: "Отменён",
};

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== "admin")) notFound();

  const stages = [
    ["Заказ создан", new Date(order.createdAt).toLocaleString("ru-RU")],
    ["Заказ принят", order.status === "pending" ? "Ожидает подтверждения продавцом" : order.status === "cancelled" ? "Заказ отменён" : "Этап подтверждён"],
    ["Выполнение", order.status === "in_progress" || order.status === "completed" ? "Работа выполняется или завершена" : "Ожидает начала работы"],
    ["Завершение", order.status === "completed" ? "Покупатель подтвердил выполнение" : "Ожидает завершения сделки"],
  ];

  return <main className="page-shell standard-page">
    <div className="page-intro">
      <div><p className="eyebrow">ЗАКАЗ · {order.id}</p><h1>{order.serviceTitle}</h1><p className="intro-copy">Создан {new Date(order.createdAt).toLocaleString("ru-RU")}</p></div>
      <Link className="button button-outline" href="/orders">← Все заказы</Link>
    </div>
    <div className="service-detail">
      <section className="detail-panel">
        <p className="eyebrow">ТЕКУЩИЙ СТАТУС</p>
        <span className={`status ${order.status === "pending" ? "pending" : order.status === "cancelled" ? "review" : ""}`}>{statusNames[order.status] ?? order.status}</span>
        <h2 style={{ marginTop: 20 }}>Условия заказа</h2>
        <div className="profile-meta"><span>Покупатель: {order.buyer.name} ({order.buyer.email})</span><span>Продавец: {order.seller.name} ({order.seller.email})</span></div>
        <div className="detail-price">{new Intl.NumberFormat("ru-KZ").format(order.price)} ₸</div>
        <p>Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}</p>
        <p>Последнее изменение: {new Date(order.updatedAt).toLocaleString("ru-RU")}</p>
        <OrderActions id={order.id} role={user.role} status={order.status} />
      </section>
      <section className="detail-panel">
        <p className="eyebrow">ЭТАПЫ СДЕЛКИ</p>
        <div className="detail-timeline">{stages.map(([title, description]) => <div className="timeline-step" key={title}><span className="timeline-dot" /><div><strong>{title}</strong><p>{description}</p></div></div>)}</div>
      </section>
    </div>
  </main>;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="page-shell standard-page"><p>Загружаем заказ…</p></main>}><OrderContent params={params} /></Suspense>;
}
