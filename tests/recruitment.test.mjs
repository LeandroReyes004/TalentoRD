import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

async function loadApi({email=null,allowed='admin@example.com',configured=true,respond=()=>new Response('[]')}={}) {
  const requests=[];
  const env={ADMIN_EMAILS:allowed,...(configured?{SUPABASE_URL:'https://project.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}:{})};
  const context=vm.createContext({process:{env},Response,Request,Headers,FormData,File,URL,TextDecoder,Uint8Array,RangeError,TypeError,AbortSignal,crypto,fetch:async(url,init)=>{if(String(url).includes('/auth/v1/user'))return Response.json({email,id:'test',email_confirmed_at:'2026-10-20'});requests.push({url:String(url),...init});return respond(String(url),init);}});
  const cache=new Map();
  async function load(filename) {
    if(cache.has(filename))return cache.get(filename);
    const text=await fs.readFile(filename,'utf8');
    const code=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const module=new vm.SourceTextModule(code,{context,identifier:filename});
    cache.set(filename,module);
    await module.link(async(spec,from)=>{
      if(spec==='next/headers')return new vm.SyntheticModule(['cookies'],function(){this.setExport('cookies',async()=>({get:()=>email?{value:'test-token'}:undefined}));},{context});
      return load(path.resolve(path.dirname(from.identifier),spec)+'.ts');
    });
    return module;
  }
  const module=await load(path.resolve('app/api/applications/route.ts'));
  await module.evaluate();
  return {api:module.namespace,requests};
}
const base='https://talento.example';
function form(overrides={}) {
  const data=new FormData();
  for(const [key,value] of Object.entries({name:'Prueba',email:'test@example.com',phone:'8090000000',position:'Operaciones y logística',experience:'2',education:'Universitario',availability:'Inmediata',english:'Intermedio',salary:'35000',source:'Referido',motivation:'Experiencia en logística.',consent:'on',...overrides}))data.set(key,value);
  data.set('cv',new File(['%PDF-1.4\n%%EOF'],'cv.pdf',{type:'application/pdf'}));
  return data;
}
const post=(body,origin=base)=>new Request(base+'/api/applications',{method:'POST',headers:{origin},body});

test('anonymous and non-admin accounts cannot list or download CVs',async()=>{
  for(const email of [null,'candidate@example.com']) {
    const {api,requests}=await loadApi({email});
    assert.equal((await api.GET(new Request(base+'/api/applications'))).status,401);
    assert.equal((await api.GET(new Request(base+'/api/applications?cv=00000000-0000-4000-8000-000000000000'))).status,401);
    assert.equal(requests.length,0);
  }
});
test('admin allowlist matches exact addresses, ignoring case and whitespace',async()=>{
  const {api}=await loadApi({email:'ADMIN@example.com',allowed:' other@example.com, admin@example.com '});
  assert.equal((await api.GET(new Request(base+'/api/applications'))).status,200);
  const denied=await loadApi({email:'admin@example.com',allowed:''});
  assert.equal((await denied.api.GET(new Request(base+'/api/applications'))).status,401);
});
test('unconfigured database rejects submission without claiming success',async()=>{
  const {api,requests}=await loadApi({configured:false});
  assert.equal((await api.POST(post(form()))).status,503);
  assert.equal(requests.length,0);
});
test('public submission uploads a PDF then inserts a received application',async()=>{
  const {api,requests}=await loadApi({respond:url=>url.includes('/storage/')?new Response('{}'):new Response(null,{status:201})});
  const result=await api.POST(post(form()));
  assert.equal(result.status,201);
  assert.equal(requests.length,2);
  assert.ok(requests[0].url.includes('/storage/v1/object/recruitment-cvs/'));
  const row=JSON.parse(requests[1].body);
  assert.equal(row.email,'test@example.com');assert.equal(row.experience,2);
  assert.ok(!('status' in row));assert.ok(!('cv_key' in await result.json()));
});
test('invalid fields, fake PDF and foreign origins are rejected',async()=>{
  const {api,requests}=await loadApi();
  for(const overrides of [{experience:''},{salary:''},{position:'injected'},{consent:''}])assert.equal((await api.POST(post(form(overrides)))).status,400);
  const fake=form();fake.set('cv',new File(['not PDF'],'fake.pdf',{type:'application/pdf'}));
  assert.equal((await api.POST(post(fake))).status,400);
  assert.equal((await api.POST(post(form(),'https://foreign.example'))).status,403);
  assert.equal(requests.length,0);
});
test('failed insert removes the newly uploaded CV and returns an error',async()=>{
  const {api,requests}=await loadApi({respond:(url,init)=>init.method==='POST'&&url.includes('/rest/')?new Response('{}',{status:500}):new Response('{}')});
  assert.equal((await api.POST(post(form()))).status,503);
  assert.equal(requests.length,3);assert.equal(requests[2].method,'DELETE');
});
test('download remains private and never returns a public Supabase URL',async()=>{
  const {api}=await loadApi({email:'admin@example.com',respond:url=>url.includes('/rest/')?Response.json([{cv_key:'00000000-0000-4000-8000-000000000000.pdf'}]):new Response('%PDF-1.4')});
  const result=await api.GET(new Request(base+'/api/applications?cv=00000000-0000-4000-8000-000000000000'));
  assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal(result.headers.get('content-type'),'application/pdf');
});
test('status changes reject anonymous accounts and malformed JSON',async()=>{
  const request=body=>new Request(base+'/api/applications',{method:'PATCH',headers:{origin:base},body});
  const anon=await loadApi();
  assert.equal((await anon.api.PATCH(request('{}'))).status,401);
  const admin=await loadApi({email:'admin@example.com',respond:()=>Response.json([{id:'00000000-0000-4000-8000-000000000000'}])});
  assert.equal((await admin.api.PATCH(request('{'))).status,400);
  assert.equal((await admin.api.PATCH(request(JSON.stringify({id:'00000000-0000-4000-8000-000000000000',status:'Seleccionado'})))).status,200);
});
test('requests without content-length are still bounded',async()=>{
  const {api,requests}=await loadApi();
  const body=new Uint8Array(6*1024*1024+1);
  assert.equal((await api.POST(post(body))).status,413);
  assert.equal(requests.length,0);
});
