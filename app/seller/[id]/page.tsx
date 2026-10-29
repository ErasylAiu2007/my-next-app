import Link from "next/link";
import { PageIntro, SectionTitle, ServiceCard } from "../../_components/site";

export default function SellerProfilePage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="ПРОФИЛЬ АВТОРА" title="Портфолио и услуги" description="Страница исполнителя: информация о специалисте, опубликованные работы и доступные услуги." />
      <section className="seller-profile">
        <div className="profile-avatar">АК</div>
        <div>
          <p className="eyebrow">ВИДЕОГРАФ · МОСКВА</p>
          <h2>Алина Ким <span className="verified">✓</span></h2>
          <p>Создаю видео, в которых важна каждая деталь. Работаю с брендами, артистами и людьми, которым есть что рассказать.</p>
          <div className="profile-meta"><span>★ 4.9 · 28 отзывов</span><span>На платформе с 2025</span><span>Ответ обычно за день</span></div>
          <div className="hero-actions" style={{ marginTop: 18 }}><Link className="button button-dark" href="/chats/demo">Написать автору <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>
      <div className="profile-content">
        <SectionTitle title="Услуги автора" detail="Пример карточек услуг" />
        <div className="service-grid">
          <ServiceCard title="Монтаж, который держит внимание" category="ВИДЕОМОНТАЖ" price="15 000" seller="Алина К." theme="mint" />
          <ServiceCard title="Цвет и настроение кадра" category="ЦВЕТОКОРРЕКЦИЯ" price="8 000" seller="Алина К." theme="peach" />
          <ServiceCard title="Ролик для вашего продукта" category="РЕКЛАМА" price="18 000" seller="Алина К." theme="blue" />
        </div>
      </div>
    </main>
  );
}
