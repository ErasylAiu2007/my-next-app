"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportButton } from "./report-button";
import { ReviewForm } from "./review-form";

export function OrderActions({ id, role, status }: { id: string; role: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (status === "completed") return <div className="order-actions">{role === "buyer" ? <ReviewForm orderId={id} /> : null}<ReportButton targetType="order" targetId={id} /></div>;
  if (status === "cancelled") return <ReportButton targetType="order" targetId={id} />;
  const choices = role === "seller"
    ? (status === "pending" ? [{ value: "accepted", label: "Принять заказ" }, { value: "cancelled", label: "Отменить заказ" }]
      : status === "accepted" ? [{ value: "in_progress", label: "Начать работу" }, { value: "cancelled", label: "Отменить заказ" }]
      : status === "in_progress" ? [{ value: "cancelled", label: "Отменить заказ" }] : [])
    : role === "buyer"
      ? [...(status === "in_progress" ? [{ value: "completed", label: "Подтвердить выполнение" }] : []), { value: "cancelled", label: "Отменить заказ" }]
      : [];

  async function update(statusValue: string) {
    if (!window.confirm("Подтвердите изменение статуса заказа.")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Не удалось обновить заказ.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setMessage("Не удалось связаться с сервером.");
      setBusy(false);
    }
  }

  return <div className="order-actions">
    {choices.map((choice) => <button className={`button ${choice.value === "cancelled" ? "button-outline" : "button-dark"}`} type="button" key={choice.value} disabled={busy} onClick={() => update(choice.value)}>{choice.label}</button>)}
    <ReportButton targetType="order" targetId={id} />
    {message ? <p className="form-error" role="alert">{message}</p> : null}
  </div>;
}

export function CreateOrderButton({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      const data = await response.json() as { id?: string; error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok || !data.id) {
        setError(data.error ?? "Не удалось оформить заказ.");
        setBusy(false);
        return;
      }
      router.push(`/orders/${data.id}`);
    } catch {
      setError("Не удалось связаться с сервером.");
      setBusy(false);
    }
  }
  return <div><button className="button button-lime" type="button" disabled={busy} onClick={create}>{busy ? "Создаём заказ…" : "Заказать услугу"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}</div>;
}
