import { cookies } from 'next/headers';
import { findCompany, type Company } from './companies';
export const SESSION_COOKIE='talentord_admin';
export const sessionCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export async function getAdmin():Promise<{email:string;userId:string;company:Company}|null> {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!token||!url||!key)return null;
  try {
    const result=await fetch(new URL('/auth/v1/user',url),{headers:{apikey:key,Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!result.ok)return null;
    const user=await result.json();
    if(!user.email_confirmed_at||typeof user.email!=='string')return null;
    const company=await findCompany('owner_user_id',user.id);
    return company?{email:user.email,userId:user.id,company}:null;
  } catch {return null;}
}
