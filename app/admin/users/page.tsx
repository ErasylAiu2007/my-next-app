import { WorkspacePage } from "../../_components/site";

export default function AdminUsersPage() {
  return <WorkspacePage
    eyebrow="АДМИНИСТРИРОВАНИЕ · АККАУНТЫ"
    title="Пользователи и роли"
    description="Структура раздела управления пользователями, статусами аккаунтов и назначением ролей."
    stats={[
      { label: "Всего пользователей", value: "1 248", note: "Демонстрационное значение" },
      { label: "Покупатели", value: "816", note: "Активные профили" },
      { label: "Продавцы", value: "432", note: "Активные профили" },
      { label: "Модераторы", value: "08", note: "Назначены администраторами" },
    ]}
    sections={[
      { title: "Список аккаунтов", description: "Поиск и просмотр информации о пользователях платформы.", href: "/admin", label: "Открыть список" },
      { title: "Назначение ролей", description: "Управление правами только для уполномоченных администраторов.", href: "/admin", label: "Управлять ролями" },
    ]}
  />;
}
