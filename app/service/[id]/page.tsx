import Link from "next/link";
import { PageIntro } from "../../_components/site";

export default function ServiceDetailPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="УСЛУГА · ВИДЕОМОНТАЖ" title="Монтаж, который держит внимание" description="Карточка отдельной услуги: краткое описание, исполнитель, стоимость и ориентир по срокам." />
      <div className="service-detail">
        <div>
          <div className="detail-art" role="img" aria-label="Обложка услуги видеомонтажа" />
          <section className="profile-content"><h2>Что входит в услугу</h2><p className="intro-copy">Монтаж исходного материала, подбор ритма и музыки, базовая цветокоррекция и один раунд правок. Здесь будет подробное описание услуги и примеры работ автора.</p></section>
        </div>
        <aside className="detail-panel">
          <p className="eyebrow">УСЛУГА АВТОРА</p>
          <h2>Монтаж для вашего проекта</h2>
          <p>Динамичный видеоролик для социальных сетей, бренда или личного проекта.</p>
          <div className="profile-meta"><span>★ 4.9</span><span>Срок: от 5 дней</span></div>
          <div className="detail-price">от 15 000 ₽</div>
          <Link className="button button-lime" href="/chats/demo">Обсудить проект <span aria-hidden="true">↗</span></Link>
          <Link className="button button-outline" href="/seller/demo">Профиль автора</Link>
        </aside>
      </div>
    </main>
  );
}
