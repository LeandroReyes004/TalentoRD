import { cookies } from 'next/headers';
export const SESSION_COOKIE='talentord_admin';
export const sessionCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export function isAdminEmail(email:string,allowedEmails:string|undefined):boolean {
  return (allowedEmails||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}
export async function getAdmin():Promise<{email:string;userId:string}|null> {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!token||!url||!key)return null;
  try {
    const result=await fetch(new URL('/auth/v1/user',url),{headers:{apikey:key,Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!result.ok)return null;
    const user=await result.json();
    return user.email_confirmed_at&&typeof user.email==='string'&&isAdminEmail(user.email,process.env.ADMIN_EMAILS)?{email:user.email,userId:user.id}:null;
  } catch {return null;}
}
