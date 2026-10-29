import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">С ВОЗВРАЩЕНИЕМ</p>
        <h1>Войти в VideoMarket</h1>
        <p>Войдите, чтобы продолжить общение и следить за своими проектами.</p>
        <div className="mock-field"><label htmlFor="email">Электронная почта</label><input id="email" placeholder="name@example.com" disabled /></div>
        <div className="mock-field"><label htmlFor="password">Пароль</label><input id="password" placeholder="Введите пароль" type="password" disabled /></div>
        <button className="button button-dark" type="button" disabled>Войти</button>
        <p className="auth-switch">Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></p>
        <p className="prototype-note">Форма показана как макет. Авторизация пока не подключена.</p>
      </section>
    </main>
  );
}
