import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">СОЗДАЙТЕ ПРОФИЛЬ</p>
        <h1>Присоединяйтесь</h1>
        <p>Зарегистрируйтесь как покупатель или автор. Роли модератора и администратора назначаются отдельно.</p>
        <div className="mock-field"><label htmlFor="name">Имя</label><input id="name" placeholder="Как к вам обращаться" disabled /></div>
        <div className="mock-field"><label htmlFor="register-email">Электронная почта</label><input id="register-email" placeholder="name@example.com" disabled /></div>
        <div className="mock-field"><label htmlFor="role">Роль профиля</label><input id="role" placeholder="Покупатель или продавец" disabled /></div>
        <button className="button button-dark" type="button" disabled>Создать аккаунт</button>
        <p className="auth-switch">Уже есть аккаунт? <Link href="/login">Войти</Link></p>
        <p className="prototype-note">Форма показана как макет. Создание аккаунта пока не подключено.</p>
      </section>
    </main>
  );
}
