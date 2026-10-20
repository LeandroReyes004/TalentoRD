import { cookies } from 'next/headers';
import { isAdminEmail, SESSION_COOKIE, sessionCookieOptions } from '../../../../lib/admin';

export async function POST(request:Request) {
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||!process.env.ADMIN_EMAILS)return Response.json({error:'El acceso de administración todavía no está configurado.'},{status:503});
  try {
    if(Number(request.headers.get('content-length'))>16384)return new Response(null,{status:413});
    const {email,password}=await request.json();
    if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>4096)return Response.json({error:'Datos inválidos.'},{status:400});
    if(!isAdminEmail(email,process.env.ADMIN_EMAILS))return Response.json({error:'Credenciales inválidas o cuenta no autorizada.'},{status:401});
    const response=await fetch(new URL('/auth/v1/token?grant_type=password',url),{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(!response.ok)return Response.json({error:'Credenciales inválidas o cuenta no autorizada.'},{status:401});
    const session=await response.json();
    if(!session.access_token || !session.user?.email_confirmed_at || !isAdminEmail(session.user.email,process.env.ADMIN_EMAILS))return Response.json({error:'Cuenta no autorizada o correo sin confirmar.'},{status:403});
    const store=await cookies();
    store.set(SESSION_COOKIE,session.access_token,{...sessionCookieOptions,maxAge:Math.min(Number(session.expires_in)||3600,3600)});
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({error:'No se pudo iniciar sesión. Inténtalo de nuevo.'},{status:503});}
}
