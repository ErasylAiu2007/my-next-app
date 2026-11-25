"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const reasons = [
  "Оскорбления и мат",
  "Мошенничество",
  "Спам",
  "Недостоверная информация",
  "Запрещённый контент",
  "Проблема с заказом",
  "Другое",
];

export function ReportButton({ targetType, targetId }: { targetType: "service" | "order"; targetId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: formData.get("reason"),
          description: formData.get("description"),
        }),
      });
      const result = await response.json() as { error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) {
        setError(result.error ?? "Не удалось отправить жалобу.");
        setBusy(false);
        return;
      }
      setOpen(false);
      setSuccess("Жалоба отправлена. Спасибо за сообщение.");
      window.setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Не удалось связаться с сервером.");
      setBusy(false);
    }
  }

  return <>
    <button className="button button-outline" type="button" onClick={() => { setOpen(true); setError(""); }}>Пожаловаться</button>
    {success ? <p className="form-success" role="status">{success}</p> : null}
    {open ? <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby={`report-title-${targetId}`}>
        <button className="modal-close" type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>×</button>
        <h2 id={`report-title-${targetId}`}>Пожаловаться</h2>
        <p>Выберите причину обращения. Жалобу увидит только команда модерации.</p>
        <form onSubmit={submit}>
          <label className="mock-field"><span>Причина *</span>
            <select name="reason" required defaultValue=""><option value="" disabled>Выберите причину</option>{reasons.map((reason) => <option key={reason}>{reason}</option>)}</select>
          </label>
          <label className="mock-field"><span>Дополнительное описание</span><textarea name="description" rows={4} maxLength={1000} placeholder="Расскажите подробнее, если это необходимо." /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setOpen(false)}>Отмена</button><button className="button button-dark" type="submit" disabled={busy}>{busy ? "Отправляем…" : "Отправить жалобу"}</button></div>
        </form>
      </section>
    </div> : null}
  </>;
}
