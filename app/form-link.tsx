"use client";
import { useEffect, useState } from 'react';
import { ArrowUpRight, ClipboardList, Copy, Check } from 'lucide-react';

export default function FormLink() {
  const [url,setUrl] = useState('/postular');
  const [copied,setCopied] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{setUrl(new URL('/postular',window.location.origin).href);},[]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);setError('');
      setTimeout(()=>setCopied(false),2500);
    } catch {setError('Selecciona y copia el enlace de abajo.');}
  }
  return <section className="card share-form">
    <span className="round-icon"><ClipboardList/></span>
    <h2>Un formulario listo para compartir</h2>
    <p>Las personas completan sus datos y adjuntan su CV. Tú recibes las respuestas en el panel de candidatos y las métricas se actualizan con cada solicitud.</p>
    <label>Enlace para candidatos<input readOnly value={url} onFocus={e=>e.target.select()}/></label>
    <div className="share-actions"><button className="primary" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Enlace copiado':'Copiar enlace'}</button><a className="secondary" href="/postular" target="_blank" rel="noopener noreferrer">Abrir formulario <ArrowUpRight size={16}/></a></div>
    <p role="status">{error || (copied?'Puedes enviarlo por el canal que prefieras.':'Los candidatos no tienen acceso al panel administrativo.')}</p>
  </section>;
}
