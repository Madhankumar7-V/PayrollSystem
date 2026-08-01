-- =============================================================
-- BMNT PAYROLL SYSTEM - SUPABASE SCHEMA
-- =============================================================
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =============================================================
-- 1. profiles
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text unique,
  username text unique,
  name text not null,
  designation text,
  role text not null default 'viewer' check (role in ('super_admin','admin','viewer')),
  email text,
  phone text,
  profile_photo text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

-- =============================================================
-- 2. employees
-- =============================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text unique,
  name text not null,
  department text not null,
  designation text,
  salary numeric default 0,
  joining_date date,
  bank_details text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 3. typists
-- =============================================================
create table if not exists public.typists (
  id uuid primary key default gen_random_uuid(),
  employee_ref uuid references public.employees(id) on delete set null,
  month text not null,
  year text not null,
  work_count integer default 0,
  rate numeric default 0,
  amount numeric default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 4. payslips
-- =============================================================
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  employee_ref uuid references public.employees(id) on delete set null,
  month text not null,
  year text not null,
  gross_salary numeric default 0,
  allowances numeric default 0,
  deductions numeric default 0,
  net_salary numeric default 0,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  pdf_url text,
  remarks text
);

-- =============================================================
-- 5. documents
-- =============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 6. activity_logs
-- =============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  description text,
  performed_by uuid references public.profiles(id),
  role text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 7. settings
-- =============================================================
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  application_name text default 'BMNT Payroll & Payslip Management',
  company_name text default 'BRAINYMEDIC EDUVERSE PVT LTD',
  company_logo text,
  sidebar_labels jsonb default '{"dashboard":"Dashboard","employees":"Employees","payslip":"Generate Payslip","typist":"Typist Work & Payroll","documents":"Documents","profile":"Profile"}'::jsonb,
  dashboard_card_titles jsonb default '{"employees":"Total Employees","typists":"Active Typists","payroll":"Monthly Payroll","documents":"Documents"}'::jsonb,
  footer text default 'Question Cell Department',
  theme text default 'light',
  feature_labels jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- Indexes
-- =============================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_employees_department on public.employees(department);
create index if not exists idx_typists_employee on public.typists(employee_ref);
create index if not exists idx_payslips_employee on public.payslips(employee_ref);
create index if not exists idx_documents_category on public.documents(category);
create index if not exists idx_activity_logs_performed_by on public.activity_logs(performed_by);

-- =============================================================
-- Triggers / functions
-- =============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.log_activity()
returns trigger as $$
begin
  insert into public.activity_logs(action, description, performed_by, role)
  values (
    tg_op,
    coalesce(new.name, new.action, new.employee_id, 'record changed'),
    auth.uid(),
    (select role from public.profiles where id = auth.uid())
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_employees_updated_at before update on public.employees
for each row execute function public.set_updated_at();

create trigger trg_typists_updated_at before update on public.typists
for each row execute function public.set_updated_at();

create trigger trg_documents_updated_at before update on public.documents
for each row execute function public.set_updated_at();

create trigger trg_settings_updated_at before update on public.settings
for each row execute function public.set_updated_at();

-- =============================================================
-- Views
-- =============================================================
create or replace view public.dashboard_summary as
select
  (select count(*) from public.employees) as employee_count,
  (select count(*) from public.payslips) as payslip_count,
  (select count(*) from public.documents) as document_count;

-- =============================================================
-- Seed data
-- =============================================================
insert into public.settings(application_name, company_name, footer, theme)
values ('BMNT Payroll & Payslip Management', 'BRAINYMEDIC EDUVERSE PVT LTD', 'Question Cell Department', 'light')
on conflict do nothing;

-- =============================================================
-- RLS Policies
-- =============================================================
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.typists enable row level security;
alter table public.payslips enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

create policy profiles_select_all on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);
create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);

create policy employees_select_all on public.employees for select using (true);
create policy employees_modify_all on public.employees for all using (true) with check (true);

create policy typists_select_all on public.typists for select using (true);
create policy typists_modify_all on public.typists for all using (true) with check (true);

create policy payslips_select_all on public.payslips for select using (true);
create policy payslips_modify_all on public.payslips for all using (true) with check (true);

create policy documents_select_all on public.documents for select using (true);
create policy documents_modify_all on public.documents for all using (true) with check (true);

create policy activity_logs_read_all on public.activity_logs for select using (true);
create policy activity_logs_insert_all on public.activity_logs for insert with check (true);

create policy settings_read_all on public.settings for select using (true);
create policy settings_manage_all on public.settings for all using (true) with check (true);

-- =============================================================
-- Storage Buckets
-- =============================================================
insert into storage.buckets (id, name, public)
values
  ('company-logo', 'company-logo', true),
  ('profile-pictures', 'profile-pictures', true),
  ('documents', 'documents', true),
  ('generated-payslips', 'generated-payslips', true)
on conflict (id) do nothing;

create policy company_logo_read on storage.objects for select using (bucket_id = 'company-logo');
create policy company_logo_write on storage.objects for insert with check (bucket_id = 'company-logo');
create policy profile_pictures_read on storage.objects for select using (bucket_id = 'profile-pictures');
create policy profile_pictures_write on storage.objects for insert with check (bucket_id = 'profile-pictures');
create policy documents_read on storage.objects for select using (bucket_id = 'documents');
create policy documents_write on storage.objects for insert with check (bucket_id = 'documents');
create policy payslips_read on storage.objects for select using (bucket_id = 'generated-payslips');
create policy payslips_write on storage.objects for insert with check (bucket_id = 'generated-payslips');
