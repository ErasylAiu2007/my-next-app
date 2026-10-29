import { PageIntro, ServiceCard } from "../_components/site";

const categories = ["Все услуги", "Видеомонтаж", "Съёмка", "Анимация", "Реклама", "Цветокоррекция"];

export default function CatalogPage() {
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="КАТАЛОГ" title="Найдите своего автора" description="Смотрите портфолио, сравнивайте услуги и выбирайте специалиста для своей идеи." />
      <div className="filter-row">{categories.map((category, index) => <span className={`filter-chip${index === 0 ? " active" : ""}`} key={category}>{category}</span>)}</div>
      <div className="service-grid">
        <ServiceCard title="Монтаж, который держит внимание" category="ВИДЕОМОНТАЖ" price="15 000" seller="Алина К." theme="mint" />
        <ServiceCard title="Сниму историю вашего бренда" category="СЪЁМКА" price="28 000" seller="Марат С." theme="peach" />
        <ServiceCard title="Оживлю ваш проект в 3D" category="АНИМАЦИЯ" price="12 000" seller="Кира Н." theme="blue" />
        <ServiceCard title="Ролик для вашего продукта" category="РЕКЛАМА" price="18 000" seller="Денис Р." theme="blue" />
        <ServiceCard title="Цвет и настроение кадра" category="ЦВЕТОКОРРЕКЦИЯ" price="8 000" seller="Алина К." theme="peach" />
        <ServiceCard title="История вашего события" category="СЪЁМКА" price="32 000" seller="Марат С." theme="mint" />
      </div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Карточки, фильтры и цены приведены для примера и пока не связаны с базой данных.</p>
    </main>
  );
}
