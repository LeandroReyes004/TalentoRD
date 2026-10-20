import { supabaseRequest } from './supabase';
import { defaultFormConfig, validFormConfig, type FormConfig } from './form-config';
export type Company={id:string;name:string;slug:string;form_config:FormConfig};
export async function findCompany(key:'owner_user_id'|'slug',value:string):Promise<Company|null> {
 const r=await supabaseRequest('/rest/v1/companies?select=id,name,slug,form_config&'+key+'=eq.'+encodeURIComponent(value)+'&limit=1');
 if(!r.ok)throw new Error('No se pudo consultar la empresa.');
 const [company]=await r.json() as Company[];
 if(!company)return null;
 return {...company,form_config:validFormConfig(company.form_config)?company.form_config:defaultFormConfig};
}
