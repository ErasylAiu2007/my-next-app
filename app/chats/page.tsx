import Link from "next/link";
import { PageIntro } from "../_components/site";

export default function ChatsPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="ОБЩЕНИЕ" title="Сообщения" description="Личные переписки до заказа и отдельные чаты, связанные со сделками." />
      <div className="chat-layout">
        <aside className="chat-list">
          <h2>Недавние диалоги</h2>
          <Link className="chat-item active" href="/chats/demo"><span className="avatar">М</span><span><strong>Марат С.</strong><small>Личный чат · сегодня</small></span></Link>
          <Link className="chat-item" href="/chats/demo"><span className="avatar avatar-peach">К</span><span><strong>Кира Н.</strong><small>Обсуждение проекта</small></span></Link>
          <Link className="chat-item" href="/chats/demo"><span className="avatar avatar-blue">С</span><span><strong>Сделка #VM-024</strong><small>Покупатель · Автор · Модератор</small></span></Link>
        </aside>
        <section className="chat-window">
          <h2>Марат С. <span className="muted-small">Личный чат · условия заказа</span></h2>
          <div className="chat-message">Здравствуйте! Расскажите немного о проекте и желаемом формате ролика.</div>
          <div className="chat-message own">Добрый день! Нужен короткий ролик для запуска нового продукта.</div>
          <div className="chat-placeholder">Здесь будет история сообщений и информация о заказе.</div>
          <div className="chat-compose">Поле ввода сообщения появится после подключения чатов.</div>
        </section>
      </div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Чаты и отправка сообщений пока представлены статичным макетом.</p>
    </main>
  );
}
