export async function POST(request:Request) {
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)return Response.json({error:'El registro todavía no está disponible.'},{status:503});
 try {
  const text=await request.text();if(text.length>10000)return new Response(null,{status:413});
  const {companyName,fullName,email,password}=JSON.parse(text);
  if(typeof companyName!=='string'||companyName.trim().length<2||companyName.length>100||typeof fullName!=='string'||!fullName.trim()||fullName.length>100||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<10||password.length>128)return Response.json({error:'Revisa los datos. La contraseña debe tener al menos 10 caracteres.'},{status:400});
  const slug=companyName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45)+'-'+crypto.randomUUID().slice(0,8);
  const url=new URL('/auth/v1/signup',process.env.SUPABASE_URL);
  url.searchParams.set('redirect_to',new URL('/admin/login',request.url).href);
  const result=await fetch(url,{method:'POST',headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),password,data:{company_name:companyName.trim(),full_name:fullName.trim(),company_slug:slug}}),signal:AbortSignal.timeout(20000)});
  if(!result.ok){return Response.json({error:result.status===429?'Espera unos minutos antes de volver a intentarlo.':'No se pudo completar el registro. Revisa los datos o inicia sesión si ya tienes una cuenta.'},{status:result.status===429?429:400});}
  return Response.json({ok:true,message:'Revisa tu correo y confirma tu cuenta. Después podrás iniciar sesión.'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'No se pudo completar el registro. Inténtalo de nuevo.'},{status:503});}
}
