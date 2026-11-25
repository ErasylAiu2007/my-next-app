"use client";

import { useEffect, useState, type FormEvent } from "react";

const styles = {
  form: "reviewForm-form",
  title: "reviewForm-title",
  hint: "reviewForm-hint",
  ratingField: "reviewForm-ratingField",
  ratingChoices: "reviewForm-ratingChoices",
  ratingChoice: "reviewForm-ratingChoice",
  selected: "reviewForm-selected",
  ratingHelp: "reviewForm-ratingHelp",
  commentField: "reviewForm-commentField",
  charCount: "reviewForm-charCount",
} as const;

export function ReviewForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [existing, setExisting] = useState<{ rating: number; comment: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const data = await response.json() as { rating: number; comment: string } | null | { error?: string };
        if (response.ok && data && "rating" in data) setExisting({ rating: data.rating, comment: data.comment });
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "Не удалось отправить отзыв."); return; }
      setExisting({ rating, comment: comment.trim() });
      setSuccess("Отзыв опубликован.");
    } catch {
      setError("Не удалось связаться с сервером.");
    }
  }

  if (loading) return <p>Проверяем возможность оставить отзыв…</p>;
  if (existing) return <div><p><strong>Ваш отзыв:</strong> {existing.rating} ★</p>{existing.comment ? <p>{existing.comment}</p> : null}</div>;

  return <form className={styles.form} onSubmit={submit}>
    <h3 className={styles.title}><span aria-hidden="true">✦</span> Оцените работу</h3>
    <p className={styles.hint}>Ваша оценка поможет другим покупателям выбрать специалиста.</p>
    <fieldset className={styles.ratingField}>
      <legend>Насколько вы довольны результатом?</legend>
      <div className={styles.ratingChoices}>
        {[1, 2, 3, 4, 5].map((value) => <button
          className={`${styles.ratingChoice} ${rating === value ? styles.selected : ""}`}
          type="button"
          key={value}
          aria-label={`${value} ${value === 1 ? "звезда" : "звезды"} из 5`}
          aria-pressed={rating === value}
          onClick={() => setRating(value)}
        >
          <span aria-hidden="true">★</span><small>{value}</small>
        </button>)}
      </div>
      <span className={styles.ratingHelp}>{rating === 5 ? "Отлично" : rating === 4 ? "Хорошо" : rating === 3 ? "Нормально" : rating === 2 ? "Не понравилось" : "Плохо"}</span>
    </fieldset>
    <label className={`mock-field ${styles.commentField}`}><span>Короткий отзыв <small>(необязательно)</small></span>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={3} placeholder="Что вам понравилось или что можно улучшить?" />
      <small className={styles.charCount}>{comment.length}/500</small>
    </label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {success ? <p className="form-success" role="status">{success}</p> : null}
    <button className="button button-dark" type="submit">Опубликовать отзыв</button>
  </form>;
}
