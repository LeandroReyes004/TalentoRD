import { cookies } from 'next/headers';
import { SESSION_COOKIE, sessionCookieOptions } from '../../../../lib/admin';
export async function POST(request:Request) {
  if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
  const store=await cookies();
  const token=store.get(SESSION_COOKIE)?.value;
  store.set(SESSION_COOKIE,'',{...sessionCookieOptions,maxAge:0});
  if(token&&process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY) {
    try {await fetch(new URL('/auth/v1/logout?scope=local',process.env.SUPABASE_URL),{method:'POST',headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});}catch{}
  }
  return new Response(null,{status:303,headers:{Location:new URL('/admin/login',request.url).href,'Cache-Control':'no-store'}});
}
