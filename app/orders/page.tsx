import Link from "next/link";
import { PageIntro } from "../_components/site";

const orders = [
  { id: "VM-024", title: "Монтаж ролика для запуска продукта", person: "Алина К. · покупатель", status: "В работе", style: "" },
  { id: "VM-021", title: "Анимация заставки для канала", person: "Кира Н. · покупатель", status: "Ожидает подтверждения", style: "pending" },
  { id: "VM-018", title: "Съёмка и монтаж интервью", person: "Марат С. · покупатель", status: "Проверка модератором", style: "review" },
];

export default function OrdersPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="РАБОЧЕЕ ПРОСТРАНСТВО" title="Заказы" description="Список заказов и текущие этапы сделки — от обсуждения до завершения." />
      <div className="filter-row"><span className="filter-chip active">Все заказы</span><span className="filter-chip">Активные</span><span className="filter-chip">Завершённые</span><span className="filter-chip">Споры</span></div>
      <div className="order-list">
        {orders.map((order) => <article className="order-row" key={order.id}>
          <div><strong>{order.title}</strong><small>{order.id} · обновлено сегодня</small></div>
          <div><span className="muted-small">Участники</span><small>{order.person}</small></div>
          <span className={`status ${order.style}`}>{order.status}</span>
          <Link className="text-link" href={`/orders/${order.id}`}>Открыть →</Link>
        </article>)}
      </div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Заказы и их статусы показаны для примера. Сделки пока не создаются.</p>
    </main>
  );
}
