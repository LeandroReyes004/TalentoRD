begin;
create table public.companies (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid not null unique references auth.users(id),
 name text not null check(char_length(name) between 2 and 100),
 slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{1,70}$'),
 form_config jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.companies enable row level security;
revoke all on public.companies from anon,authenticated;
grant select on public.companies to authenticated;
grant select,insert,update on public.companies to service_role;
create policy company_owner_read on public.companies for select to authenticated using(owner_user_id=(select auth.uid()));
insert into public.companies(owner_user_id,name,slug)
select id,'TalentoRD · Demostración','talentord-demo' from auth.users where email='admin@talentord.com';
alter table public.recruitment_applications add column company_id uuid references public.companies(id);
update public.recruitment_applications set company_id=(select id from public.companies where slug='talentord-demo') where company_id is null;
alter table public.recruitment_applications alter column company_id set not null;
alter table public.recruitment_applications add column form_snapshot jsonb not null default '{}'::jsonb;
create index recruitment_applications_company_date_idx on public.recruitment_applications(company_id,created_at desc);
alter table public.recruitment_applications drop constraint if exists recruitment_applications_position_check;
alter table public.recruitment_applications drop constraint if exists recruitment_applications_education_check;
alter table public.recruitment_applications drop constraint if exists recruitment_applications_availability_check;
alter table public.recruitment_applications drop constraint if exists recruitment_applications_english_check;
alter table public.recruitment_applications drop constraint if exists recruitment_applications_source_check;
create schema if not exists private;
create function private.create_company_for_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.raw_user_meta_data->>'company_name' is not null then
  insert into public.companies(owner_user_id,name,slug)
  values(new.id,new.raw_user_meta_data->>'company_name',new.raw_user_meta_data->>'company_slug');
 end if;
 return new;
end;
$$;
revoke all on function private.create_company_for_signup() from public,anon,authenticated;
create trigger create_company_for_signup after insert on auth.users for each row execute function private.create_company_for_signup();
commit;
