-- New isolated table: existing data and Cloudflare resources are left intact.
begin;
create table public.recruitment_applications (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 150),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 1 and 40),
  position text not null check (position in ('Operaciones y logística','Servicio al cliente','Administración y finanzas','Ventas y comercial','Tecnología','Otra área')),
  experience integer not null check (experience between 0 and 50),
  education text not null check (education in ('Secundaria','Técnico','Universitario','Posgrado')),
  availability text not null check (availability in ('Inmediata','En 15 días','En 30 días','Más de 30 días')),
  english text not null check (english in ('Básico','Intermedio','Avanzado')),
  salary integer not null check (salary between 0 and 10000000),
  motivation text not null check (char_length(motivation) between 1 and 2000),
  source text not null check (source in ('LinkedIn','Portal de empleo','Referido','Redes sociales','Otro')),
  cv_key text not null unique,
  cv_name text not null check (char_length(cv_name) between 1 and 200),
  status text not null default 'Recibido' check (status in ('Recibido','En revisión','Entrevista','Seleccionado','Descartado')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index recruitment_applications_created_at_idx on public.recruitment_applications (created_at desc);
alter table public.recruitment_applications enable row level security;
revoke all on public.recruitment_applications from anon, authenticated;
grant select, insert, update on public.recruitment_applications to service_role;
-- No anonymous/authenticated policies: all access passes through the server.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('recruitment-cvs','recruitment-cvs',false,4194304,array['application/pdf']);
commit;
