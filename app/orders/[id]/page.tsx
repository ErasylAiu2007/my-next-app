import Link from "next/link";
import { PageIntro } from "../../_components/site";

const stages = [
  ["Условия согласованы", "Покупатель и продавец подтвердили описание, цену и сроки."],
  ["Оплата заказа", "Средства удерживаются платёжным провайдером до завершения сделки."],
  ["Работа выполняется", "Продавец готовит материал и передаёт его покупателю."],
  ["Проверка и завершение", "Покупатель принимает результат, модератор проверяет условия."],
];

export default function OrderDetailPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="ЗАКАЗ VM-024" title="Монтаж ролика для запуска продукта" description="Страница заказа: состав сделки, участники, условия и последовательность этапов." action={<Link className="button button-outline" href="/chats/demo">Чат сделки <span aria-hidden="true">↗</span></Link>} />
      <div className="service-detail">
        <section className="detail-panel">
          <p className="eyebrow">ТЕКУЩИЙ СТАТУС</p><span className="status">В работе</span>
          <h2 style={{ marginTop: 20 }}>Условия заказа</h2>
          <p>Короткий проморолик до 60 секунд. В стоимость входят монтаж, базовая цветокоррекция и один раунд правок.</p>
          <div className="profile-meta"><span>Исполнитель: Алина К.</span><span>Срок: 5 дней</span></div>
          <div className="detail-price">15 000 ₽</div>
          <p>Файлы заказа доступны только участникам сделки в готовой системе.</p>
        </section>
        <section className="detail-panel">
          <p className="eyebrow">ЭТАПЫ СДЕЛКИ</p>
          <div className="detail-timeline">{stages.map(([title, description]) => <div className="timeline-step" key={title}><span className="timeline-dot" /><div><strong>{title}</strong><p>{description}</p></div></div>)}</div>
        </section>
      </div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Оплата, передача материалов, подтверждения и споры не реализованы в этом макете.</p>
    </main>
  );
}
