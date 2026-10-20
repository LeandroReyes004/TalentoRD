import { positions, educationLevels, availabilityOptions, englishLevels, sources } from './candidates';
export type FormConfig={title:string;description:string;positions:string[];education:string[];availability:string[];english:string[];sources:string[]};
export const defaultFormConfig:FormConfig={title:'El siguiente paso comienza aquí',description:'Cuéntanos sobre ti y descubre nuevas oportunidades.',positions,education:educationLevels,availability:availabilityOptions,english:englishLevels,sources};
export function validFormConfig(value:unknown):value is FormConfig {
 if(!value||typeof value!=='object')return false;
 const c=value as FormConfig;
 if(typeof c.title!=='string'||!c.title.trim()||c.title.length>150||typeof c.description!=='string'||c.description.length>500)return false;
 return ['positions','education','availability','english','sources'].every(k=>{const list=c[k as keyof FormConfig];return Array.isArray(list)&&list.length>0&&list.length<=40&&new Set(list).size===list.length&&list.every(v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=120);});
}
