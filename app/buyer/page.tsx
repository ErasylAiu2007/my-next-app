import Link from "next/link";
import { WorkspacePage } from "../_components/site";

export default function BuyerDashboardPage() {
  return <WorkspacePage
    eyebrow="ЛИЧНЫЙ КАБИНЕТ · ПОКУПАТЕЛЬ"
    title="Ваши проекты"
    description="Заказы, переписки и история работы с исполнителями — в одном месте."
    action={<Link className="button button-dark" href="/catalog">Найти услугу <span aria-hidden="true">↗</span></Link>}
    stats={[
      { label: "Активные заказы", value: "02", note: "В работе и обсуждении" },
      { label: "Непрочитанные", value: "03", note: "Сообщения от авторов" },
      { label: "Завершено", value: "08", note: "За всё время" },
      { label: "Избранные авторы", value: "05", note: "Сохранённые профили" },
    ]}
    sections={[
      { title: "Мои заказы", description: "Следите за этапами, сроками и результатами проектов.", href: "/orders", label: "Открыть заказы" },
      { title: "Сообщения", description: "Личные чаты с авторами и обсуждения будущих проектов.", href: "/chats", label: "Перейти в чаты" },
      { title: "История заказов и платежей", description: "Завершённые проекты, оплаты и выписки по заказам.", href: "/history", label: "Открыть историю" },
      { title: "Настройки профиля", description: "Контактная информация и предпочтения аккаунта.", href: "/settings", label: "Настроить профиль" },
    ]}
  />;
}
