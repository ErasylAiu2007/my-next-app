export default function AdminSettingsPage() {
  return <main className="admin-page">
    <div className="page-intro"><div><p className="eyebrow">АДМИНИСТРИРОВАНИЕ</p><h1>Настройки</h1><p className="intro-copy">Безопасные параметры локальной базы и первого администратора задаются через переменные окружения.</p></div></div>
    <section className="detail-panel">
      <h2>Настройка базы</h2>
      <p>Путь к SQLite задаётся в DATABASE_URL. Для локальной разработки используется файл dev.db.</p>
      <h2>Первый администратор</h2>
      <p>Создайте администратора командой npm run db:seed-admin после настройки ADMIN_EMAIL и ADMIN_PASSWORD в локальном .env. Пароль хранится только в виде криптографического хеша.</p>
      <p>Изменения ролей, блокировки пользователей, услуг, заказов и жалоб записываются в журнал действий.</p>
    </section>
  </main>;
}
