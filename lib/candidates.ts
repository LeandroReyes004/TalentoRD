export const positions = ['Operaciones y logística','Servicio al cliente','Administración y finanzas','Ventas y comercial','Tecnología','Otra área'];
export const stages = ['Recibido','En revisión','Entrevista','Seleccionado','Descartado'];
export const educationLevels = ['Secundaria','Técnico','Universitario','Posgrado'];
export const availabilityOptions = ['Inmediata','En 15 días','En 30 días','Más de 30 días'];
export const englishLevels = ['Básico','Intermedio','Avanzado'];
export const sources = ['LinkedIn','Portal de empleo','Referido','Redes sociales','Otro'];
export const MAX_CV_BYTES = 4 * 1024 * 1024;
export const CV_BUCKET = 'recruitment-cvs';

export type Candidate = {
  id:string; name:string; email:string; phone:string; position:string; experience:number;
  education:string; availability:string; english:string; salary:number; motivation:string;
  source:string; status:string; createdAt:string; cvName:string;
};

export function validCandidate(data: FormData) {
  const read = (key: string) => String(data.get(key) || '').trim();
  const name=read('name'), email=read('email').toLowerCase(), phone=read('phone');
  const position=read('position'), education=read('education'), availability=read('availability');
  const english=read('english'), motivation=read('motivation'), source=read('source');
  const experience=Number(read('experience')), salary=Number(read('salary'));
  if (!name || name.length>150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 ||
    !phone || phone.length>40 || !positions.includes(position) || !educationLevels.includes(education) ||
    !availabilityOptions.includes(availability) || !englishLevels.includes(english) || !sources.includes(source) ||
    !read('experience') || !Number.isInteger(experience) || experience<0 || experience>50 ||
    !read('salary') || !Number.isInteger(salary) || salary<0 || salary>10000000 ||
    !motivation || motivation.length>2000 || read('consent')!=='on') return null;
  return {name,email,phone,position,education,availability,english,motivation,source,experience,salary};
}
