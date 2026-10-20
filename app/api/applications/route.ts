import { getAdmin } from '../../../lib/admin';
import { supabaseConfigured, supabaseRequest } from '../../../lib/supabase';
import { CV_BUCKET, MAX_CV_BYTES, stages, validCandidate } from '../../../lib/candidates';
import { readApplicationForm } from '../../../lib/request-body';

const table='/rest/v1/recruitment_applications';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const columns='id,name,email,phone,position,experience,education,availability,english,salary,motivation,source,status,created_at,cv_name';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>json({error:'La recepción de candidaturas todavía no está habilitada. Inténtalo más adelante.'},503);
const sameOrigin=(request:Request)=>request.headers.get('origin')===new URL(request.url).origin;
type StoredCandidate=Record<string,unknown>&{created_at:string;cv_name:string;cv_key?:string};

export async function GET(request:Request) {
  if (!await getAdmin()) return json({error:'Inicia sesión con una cuenta administradora autorizada.'},401);
  if (!supabaseConfigured()) return unavailable();
  try {
    const id=new URL(request.url).searchParams.get('cv');
    if (id!==null) {
      if (!uuid.test(id)) return json({error:'Identificador inválido.'},400);
      const result=await supabaseRequest(table+'?select=cv_key&id=eq.'+id);
      if (!result.ok) throw new Error('Consulta fallida.');
      const [row]=await result.json() as StoredCandidate[];
      if (!row || !row.cv_key) return json({error:'Candidatura no encontrada.'},404);
      const file=await supabaseRequest('/storage/v1/object/authenticated/'+CV_BUCKET+'/'+row.cv_key.split('/').map(encodeURIComponent).join('/'));
      if (file.status===404) return json({error:'CV no encontrado.'},404);
      if (!file.ok) throw new Error('Descarga fallida.');
      return new Response(file.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="curriculum.pdf"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    const rows:Record<string,unknown>[]=[];
    for(let offset=0;;offset+=1000) {
      const response=await supabaseRequest(table+'?select='+columns+'&order=created_at.desc,id.desc&limit=1000&offset='+offset);
      if(!response.ok) throw new Error('Consulta fallida.');
      const page=await response.json() as StoredCandidate[];
      rows.push(...page.map(({created_at,cv_name,...rest})=>({...rest,createdAt:created_at,cvName:cv_name})));
      if(page.length<1000)break;
    }
    return json(rows);
  } catch { return json({error:'No se pudieron consultar las candidaturas en Supabase. Inténtalo de nuevo.'},503); }
}

export async function POST(request:Request) {
  if (!sameOrigin(request)) return json({error:'Origen no permitido.'},403);
  if (!supabaseConfigured()) return unavailable();
  let data:FormData;
  try {data=await readApplicationForm(request);}
  catch(error){return json({error:error instanceof RangeError?'El formulario supera el tamaño permitido.':'No se pudo leer el formulario.'},error instanceof RangeError?413:400);}
  const fields=validCandidate(data);
  if (!fields || data.get('website')) return json({error:'Revisa los datos y el consentimiento.'},400);
  const cv=data.get('cv');
  if (!(cv instanceof File) || !cv.size || cv.size>MAX_CV_BYTES || cv.type!=='application/pdf') return json({error:'Adjunta tu CV en PDF, máximo 4 MB.'},400);
  if (new TextDecoder().decode(await cv.slice(0,5).arrayBuffer())!=='%PDF-') return json({error:'El archivo no es un PDF válido.'},400);
  const id=crypto.randomUUID(),cvKey=id+'.pdf';
  try {
    const uploaded=await supabaseRequest('/storage/v1/object/'+CV_BUCKET+'/'+cvKey,{method:'POST',headers:{'Content-Type':'application/pdf','x-upsert':'false'},body:cv});
    if(!uploaded.ok)throw new Error('Carga fallida.');
    const inserted=await supabaseRequest(table,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({...fields,id,cv_key:cvKey,cv_name:cv.name.slice(0,200)})});
    if(!inserted.ok) {
      await supabaseRequest('/storage/v1/object/'+CV_BUCKET,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[cvKey]})});
      throw new Error('Registro fallido.');
    }
    return json({id},201);
  } catch {return json({error:'No pudimos confirmar el registro de tu candidatura. Inténtalo de nuevo más adelante.'},503);}
}

export async function PATCH(request:Request) {
  if (!sameOrigin(request)) return json({error:'Origen no permitido.'},403);
  if (!await getAdmin()) return json({error:'No autorizado.'},401);
  if (!supabaseConfigured()) return unavailable();
  let data:{id?:unknown;status?:unknown};
  try {
    const text=await request.text();
    if(text.length>1000)return json({error:'Solicitud demasiado grande.'},413);
    data=JSON.parse(text);
  } catch {return json({error:'Solicitud inválida.'},400);}
  if (!data || typeof data.id!=='string' || !uuid.test(data.id) || typeof data.status!=='string' || !stages.includes(data.status)) return json({error:'Estado o identificador inválido.'},400);
  try {
    const response=await supabaseRequest(table+'?id=eq.'+data.id+'&select=id',{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({status:data.status})});
    if(!response.ok)throw new Error('Actualización fallida.');
    const rows=await response.json() as {id:string}[];
    return rows.length?json({ok:true}):json({error:'Candidatura no encontrada.'},404);
  } catch {return json({error:'No se pudo actualizar la candidatura.'},503);}
}
