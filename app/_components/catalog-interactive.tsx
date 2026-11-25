"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CATALOG_CATEGORIES,
  type Service,
  type ServiceCategory,
} from "../../lib/catalog-storage";
import "./catalog-interactive.css";
import { PageIntro, SectionTitle } from "./site";
import { ReportButton } from "./report-button";
import { CreateOrderButton } from "./order-actions";
import { StartChatButton } from "./chat-ui";
import { SellerRating } from "./seller-rating";

const styles = {
  buttonDanger: "buttonDanger",
  catalogControls: "catalogControls",
  catalogEmpty: "catalogEmpty",
  catalogError: "catalogError",
  catalogField: "catalogField",
  catalogReset: "catalogReset",
  catalogResults: "catalogResults",
  catalogSearch: "catalogSearch",
  catalogStatus: "catalogStatus",
  detailArtLabel: "detailArtLabel",
  detailArtWithImage: "detailArtWithImage",
  isPublished: "isPublished",
  portfolioGrid: "portfolioGrid",
  portfolioItem: "portfolioItem",
  sellerDashboard: "sellerDashboard",
  sellerDescriptionField: "sellerDescriptionField",
  sellerFormActions: "sellerFormActions",
  sellerListSection: "sellerListSection",
  sellerManagement: "sellerManagement",
  sellerMediaNote: "sellerMediaNote",
  sellerNotice: "sellerNotice",
  sellerOtherLinks: "sellerOtherLinks",
  sellerPortfolio: "sellerPortfolio",
  sellerServiceActions: "sellerServiceActions",
  sellerServiceCopy: "sellerServiceCopy",
  sellerServiceDescription: "sellerServiceDescription",
  sellerServiceForm: "sellerServiceForm",
  sellerServiceList: "sellerServiceList",
  sellerServiceRow: "sellerServiceRow",
  sellerStats: "sellerStats",
  serviceArtWithImage: "serviceArtWithImage",
  serviceBackLink: "serviceBackLink",
  serviceCardImage: "serviceCardImage",
  serviceDetailVideo: "serviceDetailVideo",
  serviceMediaBadge: "serviceMediaBadge",
  serviceStatus: "serviceStatus",
  serviceVideoSection: "serviceVideoSection",
};

const SELLER_PROFILES: Record<string, { name: string; initials: string; role: string; city: string; description: string }> = {
  demo: {
    name: "Алина Ким",
    initials: "АК",
    role: "Видеограф",
    city: "Алматы",
    description: "Создаю видео, в которых важна каждая деталь. Работаю с брендами, артистами и людьми, которым есть что рассказать.",
  },
  "seller-marat": {
    name: "Марат Садыков",
    initials: "МС",
    role: "Оператор и режиссёр",
    city: "Астана",
    description: "Снимаю истории брендов и важных событий — от идеи и съёмочного плана до готового фильма.",
  },
  "seller-kira": {
    name: "Кира Нур",
    initials: "КН",
    role: "3D-дизайнер",
    city: "Алматы",
    description: "Превращаю идеи и продукты в выразительные 3D-истории и анимацию.",
  },
};

type StoreState = {
  services: Service[] | null;
  error: string;
};

function useCatalogServices(): StoreState {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json() as Service[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) throw new Error("error" in data ? data.error : "Не удалось загрузить каталог услуг.");
        if (active) {
          setServices(data);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setServices([]);
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить каталог услуг.");
        }
      }
    };

    void loadServices();
    return () => {
      active = false;
    };
  }, []);

  return { services, error };
}

function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;
}

function getSellerName(sellerId: string): string {
  return SELLER_PROFILES[sellerId]?.name ?? "Автор VideoMarket";
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function ServiceCardView({ service }: { service: Service }) {
  const sellerName = service.sellerName ?? getSellerName(service.sellerId);
  const imageIsWebUrl = service.imageUrl !== "" && isWebUrl(service.imageUrl);
  const artTheme = service.category === "Съёмка" ? "peach" : service.category === "Анимация" ? "blue" : "mint";

  return (
    <article className="service-card">
      <Link className={`service-art art-${artTheme}${imageIsWebUrl ? ` ${styles.serviceArtWithImage}` : ""}`} href={`/service/${service.id}`} aria-label={`Посмотреть услугу: ${service.title}`}>
        {imageIsWebUrl ? (
          <Image className={styles.serviceCardImage} src={service.imageUrl} alt="" fill unoptimized sizes="(max-width: 700px) 100vw, 33vw" />
        ) : null}
        <span className="art-label">{service.category.toLocaleUpperCase("ru")}</span>
        <span className="art-play" aria-hidden="true">▶</span>
        {!imageIsWebUrl ? <span className="art-caption">КАДР<br />ЗА КАДРОМ</span> : null}
        {service.videoUrl ? <span className={styles.serviceMediaBadge}>Видео в портфолио</span> : null}
      </Link>
      <div className="service-info">
        <Link className="service-seller" href={`/seller/${service.sellerId}`}>
          <span className="avatar avatar-small">{sellerName.slice(0, 1)}</span>{sellerName}<span className="verified">✓</span>
        </Link>
        <Link className="service-name" href={`/service/${service.id}`}>{service.title}</Link>
        <div className="service-bottom"><span>от {formatPrice(service.price)}</span><SellerRating sellerId={service.sellerId} average={service.sellerRating} count={service.sellerReviewCount} compact /></div>
        <ReportButton targetType="service" targetId={service.id} />
      </div>
    </article>
  );
}

function ServiceCards({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return <div className={styles.catalogEmpty}><strong>Пока нет опубликованных услуг</strong><p>Загляните позже или вернитесь к каталогу.</p></div>;
  }

  return <div className="service-grid">{services.map((service) => <ServiceCardView service={service} key={service.id} />)}</div>;
}

export function FeaturedServices() {
  const { services, error } = useCatalogServices();

  if (services === null) return <p className={styles.catalogStatus}>Загружаем услуги…</p>;
  if (error) return <p className={styles.catalogError} role="alert">{error}</p>;

  return <ServiceCards services={services.filter((service) => service.status === "published").slice(0, 3)} />;
}

type SortOrder = "price-asc" | "price-desc" | "title-asc" | "title-desc";

export function CatalogBrowser() {
  const { services, error } = useCatalogServices();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("price-asc");

  const visibleServices = useMemo(() => {
    if (!services) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    const min = minimumPrice === "" ? null : Number(minimumPrice);
    const max = maximumPrice === "" ? null : Number(maximumPrice);

    return services
      .filter((service) => service.status === "published")
      .filter((service) => !category || service.category === category)
      .filter((service) => (
        !normalizedQuery ||
        service.title.toLocaleLowerCase("ru").includes(normalizedQuery) ||
        service.description.toLocaleLowerCase("ru").includes(normalizedQuery)
      ))
      .filter((service) => min === null || service.price >= min)
      .filter((service) => max === null || service.price <= max)
      .sort((first, second) => {
        if (sortOrder === "price-asc") return first.price - second.price;
        if (sortOrder === "price-desc") return second.price - first.price;
        const titleComparison = first.title.localeCompare(second.title, "ru");
        return sortOrder === "title-asc" ? titleComparison : -titleComparison;
      });
  }, [services, query, category, minimumPrice, maximumPrice, sortOrder]);

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMinimumPrice("");
    setMaximumPrice("");
    setSortOrder("price-asc");
  };

  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="КАТАЛОГ" title="Найдите своего автора" description="Смотрите портфолио, сравнивайте услуги и выбирайте специалиста для своей идеи." />
      <section className={styles.catalogControls} aria-label="Поиск и фильтры услуг">
        <label className={`${styles.catalogField} ${styles.catalogSearch}`}>
          <span>Поиск по названию и описанию</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, монтаж ролика" />
        </label>
        <label className={styles.catalogField}>
          <span>Категория</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Все категории</option>
            {CATALOG_CATEGORIES.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className={styles.catalogField}>
          <span>Цена от, ₸</span>
          <input type="number" min="0" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} placeholder="0" />
        </label>
        <label className={styles.catalogField}>
          <span>Цена до, ₸</span>
          <input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Без лимита" />
        </label>
        <label className={styles.catalogField}>
          <span>Сортировка</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="title-asc">По названию: А—Я</option>
            <option value="title-desc">По названию: Я—А</option>
          </select>
        </label>
        <button className={`button button-outline ${styles.catalogReset}`} type="button" onClick={clearFilters}>Сбросить фильтры</button>
      </section>

      <div className={styles.catalogResults}>
        <SectionTitle title="Услуги авторов" detail={services === null ? "Загрузка…" : `Найдено: ${visibleServices.length}`} />
        {error ? <p className={styles.catalogError} role="alert">{error}</p> : null}
        {services === null ? <p className={styles.catalogStatus}>Загружаем каталог…</p> : error ? null : visibleServices.length > 0 ? (
          <div className="service-grid">{visibleServices.map((service) => <ServiceCardView service={service} key={service.id} />)}</div>
        ) : (
          <div className={styles.catalogEmpty}>
            <strong>Услуги не найдены</strong>
            <p>Измените запрос или сбросьте фильтры, чтобы увидеть больше предложений.</p>
            <button className="button button-dark" type="button" onClick={clearFilters}>Сбросить фильтры</button>
          </div>
        )}
      </div>
    </main>
  );
}

type ServiceDraft = {
  title: string;
  description: string;
  category: ServiceCategory;
  price: string;
  imageUrl: string;
  videoUrl: string;
};

const EMPTY_DRAFT: ServiceDraft = {
  title: "",
  description: "",
  category: CATALOG_CATEGORIES[0],
  price: "",
  imageUrl: "",
  videoUrl: "",
};

function toDraft(service: Service): ServiceDraft {
  return {
    title: service.title,
    description: service.description,
    category: service.category,
    price: String(service.price),
    imageUrl: service.imageUrl,
    videoUrl: service.videoUrl,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось сохранить изменения.";
}

function ServiceForm({
  draft,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: ServiceDraft;
  editing: boolean;
  onChange: (field: keyof ServiceDraft, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className={styles.sellerServiceForm} onSubmit={onSubmit}>
      <label className={styles.catalogField}>
        <span>Название услуги *</span>
        <input required maxLength={100} value={draft.title} onChange={(event) => onChange("title", event.target.value)} placeholder="Например, монтаж рекламного ролика" />
      </label>
      <label className={styles.catalogField}>
        <span>Категория *</span>
        <select required value={draft.category} onChange={(event) => onChange("category", event.target.value)}>
          {CATALOG_CATEGORIES.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label className={styles.catalogField}>
        <span>Цена, ₸ *</span>
        <input required type="number" min="1" step="1" value={draft.price} onChange={(event) => onChange("price", event.target.value)} placeholder="15000" />
      </label>
      <label className={`${styles.catalogField} ${styles.sellerDescriptionField}`}>
        <span>Описание *</span>
        <textarea required minLength={10} maxLength={1200} rows={5} value={draft.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Опишите, что входит в услугу и какой результат получит заказчик." />
      </label>
      <label className={styles.catalogField}>
        <span>Ссылка на изображение</span>
        <input type="url" value={draft.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} placeholder="https://example.com/portfolio.jpg" />
      </label>
      <label className={styles.catalogField}>
        <span>Ссылка на видео</span>
        <input type="url" value={draft.videoUrl} onChange={(event) => onChange("videoUrl", event.target.value)} placeholder="https://example.com/video.mp4" />
      </label>
      <div className={styles.sellerFormActions}>
        <button className="button button-dark" type="submit">{editing ? "Сохранить изменения" : "Опубликовать услугу"}</button>
        {editing ? <button className="button button-outline" type="button" onClick={onCancel}>Отменить редактирование</button> : null}
      </div>
    </form>
  );
}

export function SellerDashboard() {
  const router = useRouter();
  const { services, error } = useCatalogServices();
  const [sellerId, setSellerId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      const data = await response.json() as { user?: { id: string; role: string } };
      if (!data.user) {
        router.push("/login?next=%2Fseller");
      } else if (data.user.role !== "seller") {
        setActionError("Раздел доступен только продавцам.");
      } else {
        setSellerId(data.user.id);
      }
    }).catch(() => setActionError("Не удалось проверить доступ к кабинету."));
  }, [router]);

  const ownServices = services?.filter((service) => service.sellerId === sellerId) ?? [];
  const publishedServices = ownServices.filter((service) => service.status === "published");

  const updateDraft = (field: keyof ServiceDraft, value: string) => {
    if (field === "category") {
      const selectedCategory = CATALOG_CATEGORIES.find((category) => category === value);
      if (!selectedCategory) throw new Error("Выберите категорию услуги из списка.");
      setDraft((current) => ({ ...current, category: selectedCategory }));
      return;
    }

    setDraft((current) => ({ ...current, [field]: value }));
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setDraft(toDraft(service));
    setNotice("");
    setActionError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setNotice("");
    setActionError("");
  };

  const submitService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setActionError("");

    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      setActionError("Укажите цену в тенге, больше нуля.");
      return;
    }

    const serviceData = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      price,
      imageUrl: draft.imageUrl.trim(),
      videoUrl: draft.videoUrl.trim(),
    };

    try {
      const response = await fetch(editingId ? `/api/services/${editingId}` : "/api/services", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setActionError(result.error ?? "Не удалось сохранить услугу.");
        return;
      }
      setNotice(editingId ? "Изменения услуги сохранены." : "Услуга опубликована и добавлена в каталог.");
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      window.location.reload();
    } catch (saveError) {
      setActionError(getErrorMessage(saveError));
    }
  };

  const removeService = async (service: Service) => {
    if (!window.confirm(`Удалить услугу «${service.title}»? Это действие нельзя отменить.`)) return;
    setNotice("");
    setActionError("");

    try {
      const response = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setActionError(result.error ?? "Не удалось удалить услугу.");
        return;
      }
      if (editingId === service.id) cancelEditing();
      setNotice("Услуга удалена.");
      window.location.reload();
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError));
    }
  };

  return (
    <main className={`page-shell workspace ${styles.sellerDashboard}`}>
      <PageIntro
        eyebrow="ЛИЧНЫЙ КАБИНЕТ · ПРОДАВЕЦ"
        title="Творческая мастерская"
        description="Публикуйте услуги, обновляйте цены и показывайте портфолио клиентам."
        action={sellerId ? <Link className="button button-dark" href={`/seller/${sellerId}`}>Посмотреть профиль <span aria-hidden="true">↗</span></Link> : undefined}
      />
      <div className={`stats-grid ${styles.sellerStats}`}>
        <article className="stat-card"><p>Опубликованные услуги</p><strong>{services === null ? "…" : publishedServices.length}</strong><span>Видны в каталоге VideoMarket</span></article>
        <article className="stat-card"><p>Все ваши предложения</p><strong>{services === null ? "…" : ownServices.length}</strong><span>Управление доступно ниже</span></article>
      </div>

      {error ? <p className={styles.catalogError} role="alert">{error}</p> : null}
      {notice ? <p className={styles.sellerNotice} role="status">{notice}</p> : null}
      {actionError ? <p className={styles.catalogError} role="alert">{actionError}</p> : null}

      <section className={styles.sellerManagement}>
        <div>
          <p className="eyebrow">{editingId ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ ПУБЛИКАЦИЯ"}</p>
          <h2>{editingId ? "Изменить услугу" : "Создать услугу"}</h2>
          <p className="intro-copy">Заполните карточку услуги. Опубликованная услуга сразу появится в каталоге.</p>
        </div>
        <ServiceForm draft={draft} editing={editingId !== null} onChange={updateDraft} onSubmit={submitService} onCancel={cancelEditing} />
      </section>

      <section className={styles.sellerListSection}>
        <SectionTitle title="Мои опубликованные услуги" detail={`${publishedServices.length} услуг`} />
        {services === null ? <p className={styles.catalogStatus}>Загружаем ваши услуги…</p> : ownServices.length === 0 ? (
          <div className={styles.catalogEmpty}><strong>У вас пока нет услуг</strong><p>Заполните форму выше, чтобы опубликовать первое предложение.</p></div>
        ) : (
          <div className={styles.sellerServiceList}>
            {ownServices.map((service) => (
              <article className={styles.sellerServiceRow} key={service.id}>
                <div className={styles.sellerServiceCopy}>
                  <span className={`${styles.serviceStatus}${service.status === "published" ? ` ${styles.isPublished}` : ""}`}>{service.status === "published" ? "Опубликована" : "Черновик"}</span>
                  <h3><Link href={`/service/${service.id}`}>{service.title}</Link></h3>
                  <p>{service.category} · {formatPrice(service.price)}</p>
                  <p className={styles.sellerServiceDescription}>{service.description}</p>
                  {service.imageUrl || service.videoUrl ? <span className={styles.sellerMediaNote}>Добавлено медиа для портфолио</span> : null}
                </div>
                <div className={styles.sellerServiceActions}>
                  <button className="button button-outline" type="button" onClick={() => startEditing(service)}>Изменить</button>
                  <button className={`button ${styles.buttonDanger}`} type="button" onClick={() => removeService(service)}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.sellerOtherLinks}>
        <SectionTitle title="Другие разделы кабинета" detail="Заказы и сообщения остаются доступны из навигации." />
        <div className="workspace-grid">
          <Link className="workspace-card" href="/orders"><span className="workspace-index">01</span><div><h3>Заказы</h3><p>Новые запросы, активные проекты и их этапы.</p></div><span className="workspace-link">Перейти к заказам ↗</span></Link>
          <Link className="workspace-card" href="/chats"><span className="workspace-index">02</span><div><h3>Сообщения</h3><p>Переписки с покупателями и обсуждение условий.</p></div><span className="workspace-link">Открыть сообщения ↗</span></Link>
        </div>
      </section>
    </main>
  );
}

export function SellerProfile({ sellerId }: { sellerId: string }) {
  const { services, error } = useCatalogServices();
  const profile = SELLER_PROFILES[sellerId];
  const publishedServices = services?.filter((service) => service.sellerId === sellerId && service.status === "published") ?? [];

  if (services === null) {
    return <main className="page-shell standard-page"><p className={styles.catalogStatus}>Загружаем профиль продавца…</p></main>;
  }
  if (error) {
    return <main className="page-shell standard-page"><p className={styles.catalogError} role="alert">{error}</p><Link className="button button-outline" href="/catalog">Вернуться в каталог</Link></main>;
  }
  if (!profile && publishedServices.length === 0) {
    return (
      <main className="page-shell standard-page">
        <PageIntro eyebrow="ПРОФИЛЬ АВТОРА" title="Профиль не найден" description="Продавец не найден или пока не опубликовал услуги." />
        <Link className="button button-dark" href="/catalog">Вернуться в каталог</Link>
      </main>
    );
  }

  const sellerName = profile?.name ?? "Автор VideoMarket";
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow="ПРОФИЛЬ АВТОРА" title="Портфолио и услуги" description="Информация о специалисте, опубликованные работы и доступные услуги." />
      <section className="seller-profile">
        <div className="profile-avatar">{profile?.initials ?? sellerName.slice(0, 2).toLocaleUpperCase("ru")}</div>
        <div>
          <p className="eyebrow">{profile ? `${profile.role} · ${profile.city}`.toLocaleUpperCase("ru") : "АВТОР VIDEOMARKET"}</p>
          <h2>{publishedServices[0]?.sellerName ?? sellerName} <span className="verified">✓</span></h2>
          <p>{profile?.description ?? "Публикует услуги и делится своим портфолио на VideoMarket."}</p>
          <div className="profile-meta"><span>{publishedServices.length} опубликованных услуг</span><span>Портфолио VideoMarket</span></div>
          <div style={{ marginTop: 14 }}><SellerRating sellerId={sellerId} /></div>
          <div className="hero-actions" style={{ marginTop: 18 }}><StartChatButton sellerId={sellerId} /></div>
        </div>
      </section>
      <div className="profile-content">
        <SectionTitle title="Услуги автора" detail={`${publishedServices.length} опубликованных услуг`} />
        <ServiceCards services={publishedServices} />
      </div>
      <section className={styles.sellerPortfolio}>
        <SectionTitle title="Портфолио" detail="Изображения и видео из карточек услуг автора" />
        {publishedServices.filter((service) => service.imageUrl || service.videoUrl).length === 0 ? (
          <div className={styles.catalogEmpty}><strong>Портфолио пока не добавлено</strong><p>Работы появятся здесь, когда автор добавит медиа к своим услугам.</p></div>
        ) : (
          <div className={styles.portfolioGrid}>
            {publishedServices.filter((service) => service.imageUrl || service.videoUrl).map((service) => (
              <article className={styles.portfolioItem} key={service.id}>
                {service.imageUrl && isWebUrl(service.imageUrl) ? <Image src={service.imageUrl} alt={`Портфолио: ${service.title}`} width={640} height={400} unoptimized /> : null}
                {service.videoUrl && isWebUrl(service.videoUrl) ? <video src={service.videoUrl} controls preload="metadata">Ваш браузер не поддерживает воспроизведение видео.</video> : null}
                <p><Link href={`/service/${service.id}`}>{service.title}</Link></p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export function ServiceDetails({ serviceId }: { serviceId: string }) {
  const { services, error } = useCatalogServices();

  if (services === null) {
    return <main className="page-shell standard-page"><p className={styles.catalogStatus}>Загружаем услугу…</p></main>;
  }
  if (error) {
    return <main className="page-shell standard-page"><p className={styles.catalogError} role="alert">{error}</p><Link className="button button-outline" href="/catalog">Вернуться в каталог</Link></main>;
  }

  const service = services.find((item) => item.id === serviceId && item.status === "published");
  if (!service) {
    return (
      <main className="page-shell standard-page">
        <PageIntro eyebrow="УСЛУГА" title="Услуга не найдена" description="Возможно, она была удалена или больше не опубликована." />
        <Link className="button button-dark" href="/catalog">Вернуться в каталог</Link>
      </main>
    );
  }

  const imageUrl = service.imageUrl && isWebUrl(service.imageUrl) ? service.imageUrl : "";
  const videoUrl = service.videoUrl && isWebUrl(service.videoUrl) ? service.videoUrl : "";
  return (
    <main className="page-shell standard-page">
      <PageIntro eyebrow={`УСЛУГА · ${service.category.toLocaleUpperCase("ru")}`} title={service.title} description={service.description} />
      <div className="service-detail">
        <div>
          <div className={`detail-art ${imageUrl ? styles.detailArtWithImage : ""}`}>
            {imageUrl ? <Image src={imageUrl} alt={`Изображение услуги: ${service.title}`} fill unoptimized sizes="(max-width: 800px) 100vw, 60vw" /> : <span className={styles.detailArtLabel}>VIDEOMARKET · ПОРТФОЛИО</span>}
          </div>
          {videoUrl ? (
            <section className={`profile-content ${styles.serviceVideoSection}`}>
              <h2>Видео в портфолио</h2>
              <video className={styles.serviceDetailVideo} src={videoUrl} controls preload="metadata">Ваш браузер не поддерживает воспроизведение видео.</video>
              <a className="text-link" href={videoUrl} target="_blank" rel="noreferrer">Открыть видео в новой вкладке ↗</a>
            </section>
          ) : null}
          <section className="profile-content"><h2>Что входит в услугу</h2><p className="intro-copy">{service.description}</p></section>
        </div>
        <aside className="detail-panel">
          <p className="eyebrow">УСЛУГА АВТОРА</p>
          <h2>{service.title}</h2>
          <p>{service.description}</p>
          <div className="profile-meta"><span>{service.category}</span><Link href={`/seller/${service.sellerId}`}>{service.sellerName ?? getSellerName(service.sellerId)}</Link></div>
          <div className="detail-price">{formatPrice(service.price)}</div>
          <CreateOrderButton serviceId={service.id} />
          <StartChatButton sellerId={service.sellerId} className="button button-outline" />
          <ReportButton targetType="service" targetId={service.id} />
          <Link className="button button-outline" href={`/seller/${service.sellerId}`}>Профиль автора</Link>
          <Link className={styles.serviceBackLink} href="/catalog">← Назад в каталог</Link>
        </aside>
      </div>
    </main>
  );
}
