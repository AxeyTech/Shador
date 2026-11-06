-- ==============================================================================
-- ShadowTrace — Supabase PostgreSQL Database Architecture & RLS Schema
-- Standard Compliance: IEEE Std 830-1998
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";

-- 2. Drop existing tables if re-initializing
-- drop table if exists public.scan_logs cascade;
-- drop table if exists public.scans cascade;
-- drop table if exists public.profiles cascade;

-- 3. PROFILES Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SCANS Table (Master repository for reconnaissance audits)
create table if not exists public.scans (
  id text primary key, -- st-xxx UUID or nano ID
  user_id uuid references public.profiles(id) on delete set null,
  target_domain text not null,
  status text check (status in ('running', 'completed', 'failed')) default 'running',
  risk_score integer default 0, -- 0 (Hardened) to 100 (Critical Risk)
  letter_grade text check (letter_grade in ('A', 'B', 'C', 'D', 'F')),
  is_public boolean default true,
  execution_time_ms integer default 0,
  
  -- Structured Telemetry Blobs (JSONB)
  dns_data jsonb default '{}'::jsonb,
  email_spoof jsonb default '{}'::jsonb,
  subdomains_data jsonb default '{}'::jsonb,
  tls_data jsonb default '{}'::jsonb,
  headers_data jsonb default '{}'::jsonb,
  ai_analysis jsonb default '{}'::jsonb,
  graph_topology jsonb default '{}'::jsonb,
  drift_data jsonb default null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SCAN_LOGS Table (Diagnostic execution stream)
create table if not exists public.scan_logs (
  id uuid default uuid_generate_v4() primary key,
  scan_id text references public.scans(id) on delete cascade not null,
  log_level text check (log_level in ('info', 'warn', 'error', 'success')),
  category text default 'CORE',
  message text not null,
  duration_ms integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. High-Performance Indexes for Sub-80ms Queries
create index if not exists idx_scans_target_domain on public.scans(target_domain);
create index if not exists idx_scans_created_at on public.scans(created_at desc);
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scan_logs_scan_id on public.scan_logs(scan_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.scan_logs enable row level security;

-- Profiles: Users can view & edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Scans: Public scans are viewable by everyone; Private scans only by creator
create policy "Public scans viewable by anyone" on public.scans
  for select using (is_public = true or auth.uid() = user_id);

create policy "Anyone can insert scans" on public.scans
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete own scans" on public.scans
  for delete using (auth.uid() = user_id);

-- Scan Logs: Viewable if parent scan is viewable
create policy "Logs viewable if scan is viewable" on public.scan_logs
  for select using (
    exists (
      select 1 from public.scans
      where scans.id = scan_logs.scan_id
      and (scans.is_public = true or scans.user_id = auth.uid())
    )
  );

create policy "Anyone can insert logs" on public.scan_logs
  for insert with check (true);
