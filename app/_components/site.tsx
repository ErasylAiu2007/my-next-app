import Link from "next/link";

const navigation = [
  { href: "/catalog", label: "Каталог" },
  { href: "/seller/demo", label: "Исполнители" },
  { href: "/orders", label: "Заказы" },
  { href: "/chats", label: "Сообщения" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="VideoMarket — главная">
        <span className="brand-mark">V</span>
        <span>video<span className="brand-light">market</span></span>
      </Link>
      <nav className="main-nav" aria-label="Основная навигация">
        {navigation.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="button button-quiet header-login" href="/login">Войти</Link>
        <Link className="button button-dark header-register" href="/register">Стать автором <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="intro-copy">{description}</p>
      </div>
      {action ? <div className="intro-action">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  detail,
  href,
  linkLabel = "Смотреть все",
}: {
  title: string;
  detail?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
      {href ? <Link className="text-link" href={href}>{linkLabel} <span aria-hidden="true">→</span></Link> : null}
    </div>
  );
}

export function ServiceCard({
  title,
  category,
  price,
  seller,
  theme = "mint",
  href = "/service/demo",
}: {
  title: string;
  category: string;
  price: string;
  seller: string;
  theme?: "mint" | "peach" | "blue";
  href?: string;
}) {
  return (
    <article className="service-card">
      <Link className={`service-art art-${theme}`} href={href} aria-label={`Посмотреть услугу: ${title}`}>
        <span className="art-label">{category}</span>
        <span className="art-play" aria-hidden="true">▶</span>
        <span className="art-caption">КАДР<br />ЗА КАДРОМ</span>
      </Link>
      <div className="service-info">
        <div className="service-seller"><span className="avatar avatar-small">{seller.slice(0, 1)}</span>{seller}<span className="verified">✓</span></div>
        <Link className="service-name" href={href}>{title}</Link>
        <div className="service-bottom"><span>от {price} ₽</span><span className="rating">★ 4.9</span></div>
      </div>
    </article>
  );
}

export function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="stat-card"><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

export function WorkspacePage({
  eyebrow,
  title,
  description,
  stats,
  sections,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: { label: string; value: string; note: string }[];
  sections: { title: string; description: string; href: string; label: string }[];
  action?: React.ReactNode;
}) {
  return (
    <main className="page-shell workspace">
      <PageIntro eyebrow={eyebrow} title={title} description={description} action={action} />
      <div className="stats-grid">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>
      <SectionTitle title="Разделы кабинета" detail="Структура личного пространства — содержимое появится на следующих этапах." />
      <div className="workspace-grid">
        {sections.map((section, index) => (
          <Link className="workspace-card" href={section.href} key={section.title}>
            <span className="workspace-index">0{index + 1}</span>
            <div><h3>{section.title}</h3><p>{section.description}</p></div>
            <span className="workspace-link">{section.label} <span aria-hidden="true">↗</span></span>
          </Link>
        ))}
      </div>
      <p className="prototype-note"><span aria-hidden="true">✳</span> Демоверсия интерфейса. Данные и действия пока не подключены.</p>
    </main>
  );
}
