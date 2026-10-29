import { WorkspacePage } from "../../_components/site";

export default function AdminAuditPage() {
  return <WorkspacePage
    eyebrow="АДМИНИСТРИРОВАНИЕ · АУДИТ"
    title="Журнал действий"
    description="Раздел с историей критических действий модераторов и администраторов."
    stats={[
      { label: "Записей за неделю", value: "126", note: "Демонстрационное значение" },
      { label: "Действий модераторов", value: "98", note: "Проверки и жалобы" },
      { label: "Действий администраторов", value: "28", note: "Управление платформой" },
      { label: "Изменения финансов", value: "0", note: "История защищена от правок" },
    ]}
    sections={[
      { title: "Журнал модерации", description: "Проверки публикаций и результаты рассмотрения жалоб.", href: "/moderator", label: "Открыть журнал" },
      { title: "Финансовый журнал", description: "Записи об оплатах и выплатах в отдельном неизменяемом журнале.", href: "/history", label: "Смотреть операции" },
    ]}
  />;
}
