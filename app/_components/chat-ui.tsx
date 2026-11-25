"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type ChatItem = {
  id: string;
  peer: { id: string; name: string; role: string };
  lastMessage: { body: string; createdAt: string; senderId: string; senderRole: string } | null;
  unreadCount: number;
};
type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; role: string };
};
type MessageResponse = {
  currentUserId: string;
  peer: { id: string; name: string; role: string };
  messages: Message[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ChatsInbox() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadChats = useCallback(async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json() as ChatItem[] | { error?: string };
      if (response.status === 401) {
        router.push("/login?next=%2Fchats");
        return;
      }
      if (!response.ok || !Array.isArray(data)) {
        setError(!Array.isArray(data) ? data.error ?? "Не удалось загрузить переписки." : "Не удалось загрузить переписки.");
        return;
      }
      setChats(data);
      setError("");
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadChats();
    const timer = window.setInterval(() => { void loadChats(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadChats]);

  return <main className="page-shell standard-page">
    <div className="page-intro"><div><p className="eyebrow">ОБЩЕНИЕ</p><h1>Сообщения</h1><p className="intro-copy">Ваши личные переписки с покупателями и продавцами.</p></div></div>
    <section className="chat-inbox">
      <h2>Ваши переписки</h2>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {loading ? <p className="chat-state">Загружаем переписки…</p> : null}
      {!loading && !error && chats.length === 0 ? <div className="chat-empty"><span aria-hidden="true">✉</span><strong>Переписок пока нет</strong><p>Откройте профиль продавца или услугу и нажмите «Написать продавцу».</p><Link className="button button-dark" href="/catalog">Перейти в каталог</Link></div> : null}
      <div className="chat-inbox-list">{chats.map((chat) => <Link className="chat-inbox-item" href={`/chats/${chat.id}`} key={chat.id}>
        <span className="chat-avatar" aria-hidden="true">{chat.peer.name.slice(0, 1).toLocaleUpperCase("ru")}</span>
        <span className="chat-inbox-copy">
          <strong>{chat.peer.name}</strong>
          <small>{chat.peer.role === "seller" ? "Продавец" : "Покупатель"}{chat.lastMessage ? ` · ${formatTime(chat.lastMessage.createdAt)}` : ""}</small>
          <span>{chat.lastMessage?.body ?? "Начните переписку — отправьте сообщение."}</span>
        </span>
        {chat.unreadCount > 0 ? <span className="chat-unread-badge" aria-label={`${chat.unreadCount} непрочитанных сообщений`}>{chat.unreadCount}</span> : null}
      </Link>)}</div>
    </section>
  </main>;
}

export function ChatConversation({ chatId }: { chatId: string }) {
  const [data, setData] = useState<MessageResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`);
      const result = await response.json() as MessageResponse | { error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/chats/${chatId}`)}`);
        return;
      }
      if (!response.ok || !("messages" in result)) {
        setError("error" in result && result.error ? result.error : "Не удалось загрузить сообщения.");
        return;
      }
      setData(result);
      setError("");
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }, [chatId, router]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => { void loadMessages(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json() as Message | { error?: string };
      if (!response.ok || !("id" in result)) {
        setError("error" in result && result.error ? result.error : "Не удалось отправить сообщение.");
        return;
      }
      setDraft("");
      await loadMessages();
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setSending(false);
    }
  }

  return <main className="page-shell standard-page">
    <div className="page-intro">
      <div><p className="eyebrow">ЛИЧНАЯ ПЕРЕПИСКА</p><h1>{data?.peer.name ?? "Чат"}</h1><p className="intro-copy">Сообщения обновляются автоматически.</p></div>
      <Link className="button button-outline" href="/chats">← Все сообщения</Link>
    </div>
    <section className="chat-conversation">
      <div className="chat-conversation-heading">
        <span className="chat-avatar" aria-hidden="true">{data?.peer.name.slice(0, 1).toLocaleUpperCase("ru") ?? "…"}</span>
        <div><strong>{data?.peer.name ?? "Загрузка…"}</strong><small>{data?.peer.role === "seller" ? "Продавец" : data?.peer.role === "buyer" ? "Покупатель" : ""}</small></div>
      </div>
      <div className="chat-history" aria-live="polite">
        {loading ? <p className="chat-state">Загружаем историю сообщений…</p> : null}
        {!loading && data?.messages.length === 0 ? <p className="chat-state">Это начало вашей переписки. Напишите первое сообщение.</p> : null}
        {data?.messages.map((message) => <article className={`chat-bubble ${message.senderId === data.currentUserId ? "chat-bubble-own" : ""}`} key={message.id}>
          <div className="chat-bubble-meta"><strong>{message.senderId === data.currentUserId ? "Вы" : message.sender.name}</strong><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div>
          <p>{message.body}</p>
        </article>)}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="form-error chat-error" role="alert">{error}</p> : null}
      <form className="chat-send-form" onSubmit={sendMessage}>
        <label className="sr-only" htmlFor="chat-message-input">Текст сообщения</label>
        <textarea id="chat-message-input" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Напишите сообщение…" required />
        <button className="button button-dark" type="submit" disabled={sending || !draft.trim()}>{sending ? "Отправляем…" : "Отправить"}</button>
      </form>
    </section>
  </main>;
}

export function StartChatButton({ sellerId, className = "button button-dark" }: { sellerId: string; className?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function openChat() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: sellerId }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok || !result.id) {
        setError(result.error ?? "Не удалось открыть переписку.");
        return;
      }
      router.push(`/chats/${result.id}`);
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="start-chat-action">
    <button className={className} type="button" onClick={openChat} disabled={busy}>{busy ? "Открываем чат…" : "Написать продавцу"}</button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </div>;
}
