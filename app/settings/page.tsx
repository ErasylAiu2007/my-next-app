import { WorkspacePage } from "../_components/site";

export default function SettingsPage() {
  return <WorkspacePage
    eyebrow="АККАУНТ"
    title="Настройки профиля"
    description="Личные данные, описание профиля и предпочтения пользователя."
    stats={[
      { label: "Имя", value: "Профиль", note: "Данные не сохранены" },
      { label: "Электронная почта", value: "—", note: "Не подтверждена" },
      { label: "Роль", value: "Покупатель", note: "Демонстрационное значение" },
      { label: "Безопасность", value: "—", note: "Настройки не подключены" },
    ]}
    sections={[
      { title: "Личная информация", description: "Имя, контакты и базовые сведения аккаунта.", href: "/settings", label: "Настроить" },
      { title: "Публичный профиль", description: "Описание, фотография и видимость страницы автора.", href: "/seller/demo", label: "Посмотреть профиль" },
      { title: "Уведомления", description: "Предпочтения по сообщениям, заказам и обновлениям.", href: "/settings", label: "Настроить" },
      { title: "Безопасность аккаунта", description: "Пароль, вход и параметры защиты учётной записи.", href: "/settings", label: "Настроить" },
    ]}
  />;
}
