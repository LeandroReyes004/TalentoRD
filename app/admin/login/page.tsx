import LoginForm from './login-form';
export default function LoginPage() {
  return <main className="access-page"><section className="card"><div className="eyebrow">TALENTORD · EMPRESAS</div><h1>Bienvenido a tu panel</h1><p>Inicia sesión para gestionar el reclutamiento de tu empresa.</p><LoginForm/><a className="text-button" href="/registro">¿Primera vez? Registra tu empresa</a><a className="text-button" href="/">Volver al inicio</a></section></main>;
}
