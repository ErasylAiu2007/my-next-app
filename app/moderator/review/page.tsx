import { WorkspacePage } from "../../_components/site";

export default function ModerationQueuePage() {
  return <WorkspacePage
    eyebrow="МОДЕРАЦИЯ · ПУБЛИКАЦИИ"
    title="Очередь проверки работ"
    description="Проверяйте новые публикации и фиксируйте решение с причиной отклонения, если это необходимо."
    stats={[
      { label: "Ожидают проверки", value: "12", note: "Видеоработы и портфолио" },
      { label: "Проверено сегодня", value: "08", note: "Демонстрационное значение" },
      { label: "Одобрено", value: "06", note: "За последние 7 дней" },
      { label: "Отклонено", value: "02", note: "За последние 7 дней" },
    ]}
    sections={[
      { title: "Новые публикации", description: "Работы, ещё не прошедшие проверку модератором.", href: "/seller/demo", label: "Открыть публикацию" },
      { title: "История решений", description: "Результаты проверки и причины отклонений.", href: "/moderator", label: "Посмотреть историю" },
    ]}
  />;
}
