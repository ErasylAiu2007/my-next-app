import { WorkspacePage } from "../_components/site";

export default function ModeratorDashboardPage() {
  return <WorkspacePage
    eyebrow="РАБОЧЕЕ ПРОСТРАНСТВО · МОДЕРАЦИЯ"
    title="Панель модератора"
    description="Очередь публикаций, жалобы и контроль этапов сделок. Все действия должны оставлять запись в журнале."
    stats={[
      { label: "Ожидают проверки", value: "12", note: "Публикации авторов" },
      { label: "Новые жалобы", value: "03", note: "Пользователи и контент" },
      { label: "Сделки на контроле", value: "07", note: "Активные заказы" },
      { label: "Споры", value: "01", note: "Требуют рассмотрения" },
    ]}
    sections={[
      { title: "Проверка работ", description: "Очередь новых видео и портфолио на одобрение или отклонение.", href: "/moderator/review", label: "Открыть очередь" },
      { title: "Жалобы", description: "Обращения на пользователей, публикации и нарушения правил.", href: "/moderator/reports", label: "Смотреть жалобы" },
      { title: "Контроль сделок", description: "Статусы заказов, сроки и выполнение условий.", href: "/orders", label: "Открыть сделки" },
      { title: "Спорные ситуации", description: "Материалы и этапы рассмотрения споров по заказам.", href: "/orders", label: "Посмотреть споры" },
    ]}
  />;
}
