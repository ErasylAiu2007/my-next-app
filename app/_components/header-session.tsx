"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserInfo = { name: string; role: string } | null;
type ChatNotice = {
  id: string;
  peer: { name: string; role: string };
  lastMessage: { body: string; createdAt: string } | null;
  unreadCount: number;
};

function NotificationBell() {
  const [chats, setChats] = useState<ChatNotice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const unreadCount = chats.reduce((total, chat) => total + chat.unreadCount, 0);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/chats");
        const data = await response.json() as ChatNotice[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          if (active) setError(!Array.isArray(data) ? data.error ?? "Не удалось загрузить уведомления." : "Не удалось загрузить уведомления.");
          return;
        }
        if (active) {
          setChats(data.filter((chat) => chat.unreadCount > 0));
          setError("");
        }
      } catch {
        if (active) setError("Не удалось загрузить уведомления.");
      }
    };
    void loadNotifications();
    const timer = window.setInterval(() => { void loadNotifications(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return <div className="notification-wrap">
    <button className="notification-bell" type="button" aria-label={`Уведомления: ${unreadCount} непрочитанных`} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span aria-hidden="true">🔔</span>
      {unreadCount > 0 ? <span className="notification-count">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
    </button>
    {open ? <div className="notification-panel">
      <div className="notification-heading"><strong>Уведомления</strong><span>{unreadCount} непрочитано</span></div>
      {error ? <p className="notification-error" role="alert">{error}</p> : null}
      {!error && chats.length === 0 ? <p className="notification-empty">Новых сообщений нет.</p> : null}
      {chats.map((chat) => <Link className="notification-item" href={`/chats/${chat.id}`} key={chat.id} onClick={() => setOpen(false)}>
        <span className="notification-icon" aria-hidden="true">✉</span>
        <span><strong>{chat.peer.role === "seller" ? "Вам написал продавец" : "Новое сообщение от покупателя"}</strong><small>{chat.peer.name}: {chat.lastMessage?.body ?? "Новое сообщение"}</small></span>
        <span className="notification-badge">{chat.unreadCount}</span>
      </Link>)}
      <Link className="notification-all" href="/chats" onClick={() => setOpen(false)}>Все сообщения →</Link>
    </div> : null}
  </div>;
}

export function HeaderSession() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const loadUser = async () => {
      const currentRequestId = ++requestId;
      setChecked(false);
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json() as { user?: UserInfo };
        if (active && currentRequestId === requestId) setUser(response.ok ? data.user ?? null : null);
      } catch {
        if (active && currentRequestId === requestId) setUser(null);
      } finally {
        if (active && currentRequestId === requestId) setChecked(true);
      }
    };
    const handleAuthChange = () => { void loadUser(); };
    window.addEventListener("videomarket:auth-state-changed", handleAuthChange);
    void loadUser();
    return () => {
      active = false;
      window.removeEventListener("videomarket:auth-state-changed", handleAuthChange);
    };
  }, []);

  if (!checked) return <div className="header-actions"><Link className="button button-quiet header-login" href="/login">Войти</Link></div>;
  if (!user) {
    return <div className="header-actions">
      <Link className="button button-quiet header-login" href="/login">Войти</Link>
      <Link className="button button-dark header-register" href="/register">Стать автором <span aria-hidden="true">↗</span></Link>
    </div>;
  }
  return <div className="header-actions">
    {user.role === "buyer" || user.role === "seller" ? <NotificationBell /> : null}
    {user.role === "admin" ? <Link className="button button-quiet" href="/admin">Админ-панель</Link> : null}
    <Link className="button button-quiet" href="/profile">{user.name}</Link>
    <button className="button button-outline" type="button" onClick={async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.dispatchEvent(new Event("videomarket:auth-state-changed"));
      router.push("/");
      router.refresh();
    }}>Выйти</button>
  </div>;
}
