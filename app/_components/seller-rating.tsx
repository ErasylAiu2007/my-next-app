"use client";

import { useEffect, useState } from "react";

const styles = {
  ratingButton: "sellerRating-ratingButton",
  compact: "sellerRating-compact",
  ratingIcon: "sellerRating-ratingIcon",
  reviewCount: "sellerRating-reviewCount",
  outOf: "sellerRating-outOf",
  stars: "sellerRating-stars",
  starFilled: "sellerRating-starFilled",
  starHalf: "sellerRating-starHalf",
  starEmpty: "sellerRating-starEmpty",
  backdrop: "sellerRating-backdrop",
  modal: "sellerRating-modal",
  close: "sellerRating-close",
  eyebrow: "sellerRating-eyebrow",
  overall: "sellerRating-overall",
  overallScore: "sellerRating-overallScore",
  bigRatingIcon: "sellerRating-bigRatingIcon",
  count: "sellerRating-count",
  status: "sellerRating-status",
  error: "sellerRating-error",
  categories: "sellerRating-categories",
  category: "sellerRating-category",
  empty: "sellerRating-empty",
  reviews: "sellerRating-reviews",
  review: "sellerRating-review",
  reviewHeader: "sellerRating-reviewHeader",
  avatar: "sellerRating-avatar",
  reviewer: "sellerRating-reviewer",
  categoryTag: "sellerRating-categoryTag",
  reviewRating: "sellerRating-reviewRating",
} as const;

type CategoryRating = { category: string; average: number; count: number };
type ReviewSummary = {
  average: number;
  count: number;
  categories: CategoryRating[];
  reviews: Array<{ id: string; rating: number; comment: string; category: string; createdAt: string; buyerName: string }>;
};

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className={styles.stars} aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < Math.floor(rating) ? styles.starFilled : index === Math.floor(rating) && rating - Math.floor(rating) >= 0.25 ? styles.starHalf : styles.starEmpty} key={index} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export function SellerRating({ sellerId, average: initialAverage = 0, count: initialCount = 0, compact = false }: {
  sellerId: string; average?: number; count?: number; compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const average = summary?.average ?? initialAverage;
  const count = summary?.count ?? initialCount;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/reviews?sellerId=${encodeURIComponent(sellerId)}`)
      .then(async (response) => {
        const data = await response.json() as ReviewSummary;
        if (!response.ok) throw new Error("Не удалось загрузить отзывы. Попробуйте ещё раз.");
        if (active) setSummary(data);
      })
      .catch(() => { if (active) setError("Не удалось загрузить отзывы. Попробуйте ещё раз."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, sellerId]);

  return <>
    <button type="button" className={`${styles.ratingButton} ${compact ? styles.compact : ""}`} onClick={() => setOpen(true)} aria-label="Открыть рейтинг и отзывы продавца">
      <span className={styles.ratingIcon} aria-hidden="true">★</span>
      {average ? <strong>{average.toFixed(1)}<span className={styles.outOf}>/5</span></strong> : <strong>Новый продавец</strong>}
      <span className={styles.reviewCount}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4.5 3v-3.1A2.5 2.5 0 0 1 3 10.5z" /></svg>
        {count ? `${count} ${count === 1 ? "отзыв" : count > 1 && count < 5 ? "отзыва" : "отзывов"}` : "Отзывы"}
      </span>
    </button>
    {open ? <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="seller-rating-title">
        <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
        <p className={styles.eyebrow}>ОТЗЫВЫ ПОКУПАТЕЛЕЙ</p>
        <h2 id="seller-rating-title">Рейтинг и отзывы</h2>
        <div className={styles.overall}>
          <div className={styles.overallScore}>
            <span className={styles.bigRatingIcon} aria-hidden="true">★</span>
            <strong>{average ? average.toFixed(1) : "—"}</strong>
            <span>из 5</span>
          </div>
          <div>
            <Stars rating={average} label={`Средняя оценка ${average.toFixed(1)} из 5`} />
            <p className={styles.count}>{count ? `${count} ${count === 1 ? "отзыв" : count > 1 && count < 5 ? "отзыва" : "отзывов"}` : "Пока нет отзывов"}</p>
          </div>
        </div>
        {loading ? <p className={styles.status}>Загружаем рейтинг и отзывы…</p> : error ? <p className={styles.error} role="alert">{error}</p> : <>
          <section className={styles.categories} aria-labelledby="category-ratings-title">
            <h3 id="category-ratings-title">Оценки по категориям услуг</h3>
            {summary?.categories.length ? summary.categories.map((item) => <div className={styles.category} key={item.category}>
              <span>{item.category}</span>
              <Stars rating={item.average} label={`Оценка ${item.average.toFixed(1)} из 5`} />
              <strong>{item.average.toFixed(1)}<span className={styles.outOf}>/5</span></strong>
              <small>{item.count} {item.count === 1 ? "оценка" : item.count > 1 && item.count < 5 ? "оценки" : "оценок"}</small>
            </div>) : <p className={styles.empty}>Оценки по направлениям появятся, когда покупатели оставят отзывы.</p>}
          </section>
          <section className={styles.reviews} aria-labelledby="customer-reviews-title">
            <h3 id="customer-reviews-title">Что говорят клиенты</h3>
            {summary?.reviews.length ? summary.reviews.map((review) => <article className={styles.review} key={review.id}>
              <div className={styles.reviewHeader}>
                <span className={styles.avatar} aria-hidden="true">{review.buyerName.slice(0, 1).toLocaleUpperCase("ru")}</span>
                <div className={styles.reviewer}><strong>{review.buyerName}</strong><small>{new Date(review.createdAt).toLocaleDateString("ru-RU")}</small></div>
                <span className={styles.categoryTag}>{review.category}</span>
              </div>
              <div className={styles.reviewRating}><Stars rating={review.rating} label={`Оценка ${review.rating} из 5`} /><strong>{review.rating}/5</strong></div>
              <p>{review.comment || "Покупатель оставил оценку без комментария."}</p>
            </article>) : <p className={styles.empty}>Пока нет отзывов. Они появятся здесь после завершённых заказов.</p>}
          </section>
        </>}
      </section>
    </div> : null}
  </>;
}
