import { getAdmin } from '../../../lib/admin';
import { supabaseRequest } from '../../../lib/supabase';
import { validFormConfig } from '../../../lib/form-config';
export async function PUT(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
 const admin=await getAdmin();if(!admin)return Response.json({error:'No autorizado.'},{status:401});
 try{
  const text=await request.text();if(text.length>30000)return new Response(null,{status:413});
  const config=JSON.parse(text);if(!validFormConfig(config))return Response.json({error:'Revisa el título y las opciones: no pueden estar vacíos ni repetidos.'},{status:400});
  const r=await supabaseRequest('/rest/v1/companies?id=eq.'+admin.company.id+'&owner_user_id=eq.'+admin.userId,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({form_config:config})});
  if(!r.ok)throw new Error();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'No se pudo guardar el formulario.'},{status:503});}
}
