import Link from "next/link";
import { WorkspacePage } from "../_components/site";

export default function SellerDashboardPage() {
  return <WorkspacePage
    eyebrow="ЛИЧНЫЙ КАБИНЕТ · ПРОДАВЕЦ"
    title="Творческая мастерская"
    description="Управляйте портфолио, услугами, заказами и общением с клиентами."
    action={<Link className="button button-dark" href="/seller/demo">Посмотреть профиль <span aria-hidden="true">↗</span></Link>}
    stats={[
      { label: "Активные заказы", value: "04", note: "Требуют вашего внимания" },
      { label: "Работы на проверке", value: "02", note: "Ожидают модерации" },
      { label: "Просмотры профиля", value: "186", note: "За последние 30 дней" },
      { label: "Доход", value: "— ₽", note: "Данные появятся позже" },
    ]}
    sections={[
      { title: "Портфолио и публикации", description: "Добавляйте работы и отслеживайте статус проверки.", href: "/seller/demo", label: "Открыть портфолио" },
      { title: "Мои услуги", description: "Описание, категории, цены и сроки выполнения.", href: "/catalog", label: "Посмотреть услуги" },
      { title: "Заказы", description: "Новые запросы, активные проекты и их этапы.", href: "/orders", label: "Перейти к заказам" },
      { title: "Заказы и выплаты", description: "История выполненных проектов и финансовых операций.", href: "/history", label: "Открыть историю" },
      { title: "Сообщения", description: "Переписки с покупателями и обсуждение условий.", href: "/chats", label: "Открыть сообщения" },
      { title: "Настройки профиля", description: "Ваши данные, описание и публичный профиль.", href: "/settings", label: "Настроить профиль" },
    ]}
  />;
}
