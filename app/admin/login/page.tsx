import LoginForm from './login-form';
export default function LoginPage() {
  return <main className="access-page"><section className="card"><div className="eyebrow">TALENTORD · ADMINISTRACIÓN</div><h1>Bienvenido a tu panel</h1><p>Accede con la cuenta de Supabase autorizada para administrar las candidaturas.</p><LoginForm/><a className="text-button" href="/postular">Ir al formulario de postulación</a></section></main>;
}
