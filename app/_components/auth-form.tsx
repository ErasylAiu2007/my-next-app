"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string; user?: { role: string } };
      if (!response.ok) {
        setError(data.error ?? "Не удалось выполнить запрос.");
        setBusy(false);
        return;
      }
      const fallback = data.user?.role === "admin" ? "/admin" : data.user?.role === "seller" ? "/seller" : "/orders";
      const requestedNext = new URLSearchParams(window.location.search).get("next") ?? "";
      const destination = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : fallback;
      window.dispatchEvent(new Event("videomarket:auth-state-changed"));
      router.push(destination === "/" ? fallback : destination);
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">{mode === "login" ? "С ВОЗВРАЩЕНИЕМ" : "СОЗДАЙТЕ ПРОФИЛЬ"}</p>
        <h1>{mode === "login" ? "Войти в VideoMarket" : "Присоединяйтесь"}</h1>
        <p>{mode === "login" ? "Войдите, чтобы продолжить общение и следить за своими проектами." : "Зарегистрируйтесь как покупатель или продавец."}</p>
        {mode === "register" ? <label className="mock-field"><span>Имя</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Как к вам обращаться" /></label> : null}
        <label className="mock-field"><span>Электронная почта</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" /></label>
        <label className="mock-field"><span>Пароль</span><input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 10 : 1} maxLength={128} placeholder="Введите пароль" /></label>
        {mode === "register" ? (
          <label className="mock-field"><span>Роль</span><select name="role" defaultValue="buyer"><option value="buyer">Покупатель</option><option value="seller">Продавец</option></select></label>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}</button>
        <p className="auth-switch">
          {mode === "login" ? <>Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></> : <>Уже есть аккаунт? <Link href="/login">Войти</Link></>}
        </p>
      </form>
    </main>
  );
}

export function ProfilePanel() {
  const router = useRouter();
  const [message, setMessage] = useState("Загружаем профиль…");
  const [user, setUser] = useState<{ name: string; email: string; role: string; createdAt: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json() as { user?: typeof user };
        if (!response.ok || !data.user) {
          router.push("/login?next=%2Fprofile");
          return;
        }
        setUser(data.user);
        setMessage("");
      })
      .catch(() => setMessage("Не удалось загрузить профиль. Обновите страницу."));
  }, [router]);

  if (!user) return <main className="page-shell standard-page"><p>{message}</p></main>;
  const roles: Record<string, string> = { buyer: "Покупатель", seller: "Продавец", admin: "Администратор" };
  return (
    <main className="page-shell standard-page">
      <h1>Мой профиль</h1>
      <section className="detail-panel">
        <p><strong>Имя:</strong> {user.name}</p>
        <p><strong>Электронная почта:</strong> {user.email}</p>
        <p><strong>Роль:</strong> {roles[user.role] ?? user.role}</p>
        <p><strong>Дата регистрации:</strong> {new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
        <button className="button button-outline" type="button" onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.dispatchEvent(new Event("videomarket:auth-state-changed"));
          router.push("/");
          router.refresh();
        }}>Выйти из аккаунта</button>
      </section>
    </main>
  );
}
