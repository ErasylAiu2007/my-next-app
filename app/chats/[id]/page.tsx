import Link from "next/link";
import { PageIntro } from "../../_components/site";

export default function DealChatPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="ЧАТ СДЕЛКИ · VM-024" title="Проект: короткий ролик" description="В отдельном чате сделки участвуют покупатель, продавец и назначенный модератор." action={<Link className="button button-outline" href="/orders/demo">Детали заказа <span aria-hidden="true">↗</span></Link>} />
      <div className="chat-layout">
        <aside className="chat-list">
          <h2>Участники сделки</h2>
          <div className="chat-item"><span className="avatar">А</span><span><strong>Алина К.</strong><small>Продавец</small></span></div>
          <div className="chat-item"><span className="avatar avatar-peach">П</span><span><strong>Покупатель</strong><small>Заказчик</small></span></div>
          <div className="chat-item"><span className="avatar avatar-blue">М</span><span><strong>Модератор</strong><small>Контроль сделки</small></span></div>
        </aside>
        <section className="chat-window">
          <h2>Обсуждение заказа <span className="muted-small">Цена и сроки согласованы</span></h2>
          <div className="chat-message">Условия заказа зафиксированы: монтаж ролика, срок — 5 дней.</div>
          <div className="chat-message own">Подтверждаю описание проекта. Материалы передам через страницу заказа.</div>
          <div className="chat-placeholder">Статусы сделки и сообщения будут сохраняться здесь.</div>
          <div className="chat-compose">Чат сделки — статичный макет, отправка недоступна.</div>
        </section>
      </div>
    </main>
  );
}
