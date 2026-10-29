import { WorkspacePage } from "../../_components/site";

export default function ReportsPage() {
  return <WorkspacePage
    eyebrow="МОДЕРАЦИЯ · ОБРАЩЕНИЯ"
    title="Жалобы и обращения"
    description="Раздел для обработки жалоб на пользователей, публикации и поведение в сделках."
    stats={[
      { label: "Новые обращения", value: "03", note: "Требуют рассмотрения" },
      { label: "В работе", value: "04", note: "Открытые обращения" },
      { label: "Рассмотрено", value: "18", note: "За последние 7 дней" },
      { label: "Эскалации", value: "01", note: "Требуют администратора" },
    ]}
    sections={[
      { title: "Жалобы на контент", description: "Обращения о публикациях и портфолио.", href: "/moderator/review", label: "Смотреть обращения" },
      { title: "Жалобы на пользователей", description: "Обращения о нарушениях поведения и правил платформы.", href: "/moderator", label: "Смотреть обращения" },
    ]}
  />;
}
