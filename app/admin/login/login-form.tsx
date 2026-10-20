"use client";
import { useState, type FormEvent } from 'react';
export default function LoginForm() {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError('');
    const data=new FormData(e.currentTarget);
    try {
      const result=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:data.get('email'),password:data.get('password')})});
      if(!result.ok){const message=await result.json();throw new Error(message.error||'No se pudo iniciar sesión.');}
      window.location.assign('/admin');
    } catch(e){setError((e as Error).message);setBusy(false);}
  }
  return <form onSubmit={submit} className="login-form"><label>Correo electrónico<input name="email" type="email" autoComplete="username" required/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required/></label>{error&&<div className="error" role="alert">{error}</div>}<button className="primary" disabled={busy}>{busy?'Entrando…':'Entrar al panel'}</button></form>;
}
