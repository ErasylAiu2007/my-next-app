import { PageIntro } from "../_components/site";

const rows = [
  { id: "VM-016", title: "Монтаж интервью", date: "12 мая 2025", amount: "12 000 ₽", status: "Завершён" },
  { id: "VM-014", title: "Анимация заставки", date: "28 апреля 2025", amount: "8 500 ₽", status: "Завершён" },
  { id: "VM-011", title: "Видео для соцсетей", date: "06 апреля 2025", amount: "18 000 ₽", status: "Завершён" },
];

export default function HistoryPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="АРХИВ" title="История заказов и платежей" description="Завершённые проекты и записи о финансовых операциях. История платежей должна оставаться неизменяемой." />
      <div className="order-list">{rows.map((row) => <article className="order-row" key={row.id}>
        <div><strong>{row.title}</strong><small>{row.id} · {row.date}</small></div>
        <div><span className="muted-small">Статус заказа</span><small>{row.status}</small></div>
        <strong>{row.amount}</strong>
        <span className="status">Оплачен</span>
      </article>)}</div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Примерные данные. Платёжная история не подключена к провайдеру.</p>
    </main>
  );
}
