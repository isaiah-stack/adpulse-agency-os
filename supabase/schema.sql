-- ============================================================================
-- AdPulse Agency OS - Supabase schema, RLS and seed
-- Run once in the Supabase SQL editor (safe to re-run).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.workspaces (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  domain             text,
  meta_ad_account_id text,
  currency           text not null default 'KES',
  daily_budget       numeric not null default 0,
  vat_rate           numeric not null default 0.16,
  offer_name         text,
  aov                numeric not null default 0,
  gross_margin       numeric not null default 0.50,
  target_cpl         numeric not null default 0,
  close_rate         numeric not null default 0.10,
  deposit_pct        numeric not null default 0.30,
  phase              text default 'Phase 1: Track Money',
  fleet_cap_monthly  integer not null default 0,
  last_synced_at     timestamptz,
  -- Meta spend since the first M-Pesa top-up (net of VAT), written by /api/sync-meta.
  prepaid_spend       numeric,
  prepaid_spend_since date,
  -- Admin-only operating state (QA checklist, sprint tasks, Rule of 100 logs).
  ops_state          jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Columns added after the first release (no-ops on fresh installs).
alter table public.workspaces add column if not exists prepaid_spend numeric;
alter table public.workspaces add column if not exists prepaid_spend_since date;
-- Ad account currency handling: Meta reports spend in the ad account's currency
-- (e.g. USD); /api/sync-meta converts it into the workspace currency before saving.
--   fx_rate_override: admin-set rate (1 ad-account unit = N workspace units), e.g. the
--                     bank's card rate. When null, a daily market rate is fetched.
--   fx_rate / fx_rate_at / ad_account_currency: the rate actually applied, written by sync.
alter table public.workspaces add column if not exists ad_account_currency text;
alter table public.workspaces add column if not exists fx_rate_override numeric check (fx_rate_override > 0);
alter table public.workspaces add column if not exists fx_rate numeric;
alter table public.workspaces add column if not exists fx_rate_at timestamptz;
-- Sync health, written by /api/sync-meta and shown to admins (never to clients).
--   last_sync_attempt_at / last_sync_error: outcome of the latest run (error null on success).
--   meta_token_expires_at: when the Meta token (or its data access) expires; null = never/unknown.
alter table public.workspaces add column if not exists last_sync_attempt_at timestamptz;
alter table public.workspaces add column if not exists last_sync_error text;
alter table public.workspaces add column if not exists meta_token_expires_at timestamptz;

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'client' check (role in ('admin', 'client')),
  workspace_id uuid references public.workspaces (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.ad_creatives (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  meta_ad_id      text,
  asset_code      text,
  name            text,
  bucket          text,
  status          text not null default 'Active',
  launched_at     timestamptz not null default now(),
  spend           numeric not null default 0,
  impressions     bigint not null default 0,
  three_sec_views bigint not null default 0,
  outbound_clicks bigint not null default 0,
  leads           integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (workspace_id, meta_ad_id)
);

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  client_name    text,
  phone_e164     text,
  email          text,
  fbclid         text,
  icebreaker     text,
  asset_code     text,
  response_mins  numeric default 0,
  quote_amount   numeric not null default 0,
  addons_amount  numeric not null default 0,
  deposit_amount numeric not null default 0,
  status         text not null default 'New'
                 check (status in ('New', 'Quoted', 'Deposit Paid', 'Completed', 'Lost')),
  capi_exported  boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.mpesa_topups (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  gross_amount   numeric not null check (gross_amount >= 0),
  -- Kenya 16% digital VAT is deducted inclusively from every M-Pesa top-up.
  vat_deducted   numeric generated always as (round(gross_amount - gross_amount / 1.16, 2)) stored,
  net_ad_spend   numeric generated always as (round(gross_amount / 1.16, 2)) stored,
  reference      text,
  created_at     timestamptz not null default now()
);

create index if not exists ad_creatives_ws_idx on public.ad_creatives (workspace_id);
create index if not exists leads_ws_idx        on public.leads (workspace_id);
create index if not exists topups_ws_idx       on public.mpesa_topups (workspace_id);
create index if not exists profiles_ws_idx     on public.profiles (workspace_id);

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER helpers (bypass RLS on profiles -> no policy recursion)
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_workspace_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select workspace_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.my_workspace_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_workspace_id() to authenticated;

-- ----------------------------------------------------------------------------
-- Auto-provision a profile for every new auth user (defaults to 'client',
-- no workspace). Promote / assign with:
--   update public.profiles set role = 'admin' where email = 'you@agency.com';
--   update public.profiles set workspace_id = '<workspace uuid>' where email = 'owner@client.com';
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients may UPDATE their own leads, but only to confirm a deposit:
--   * only status and deposit_amount can change (all other columns are pinned),
--   * only an open inquiry ('New' or 'Quoted') can move, and only to 'Deposit Paid',
--   * the deposit must be > 0 and no more than the quoted total (when a quote exists).
create or replace function public.guard_client_lead_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_status  text    := new.status;
  v_deposit numeric := new.deposit_amount;
  v_quote   numeric := coalesce(old.quote_amount, 0) + coalesce(old.addons_amount, 0);
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service role (cron) or admin
  end if;

  new := old;
  if v_status is not distinct from old.status and v_deposit is not distinct from old.deposit_amount then
    return new; -- no-op
  end if;

  if old.status not in ('New', 'Quoted') or v_status is distinct from 'Deposit Paid' then
    raise exception 'Clients can only confirm a deposit on an open inquiry'
      using errcode = '42501';
  end if;
  if v_deposit is null or v_deposit <= 0 or (v_quote > 0 and v_deposit > v_quote) then
    raise exception 'Deposit must be greater than zero and no more than the quoted total'
      using errcode = '22023';
  end if;

  new.status := v_status;
  new.deposit_amount := v_deposit;
  return new;
end;
$$;

drop trigger if exists leads_client_guard on public.leads;
create trigger leads_client_guard
  before update on public.leads
  for each row execute function public.guard_client_lead_update();

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------

alter table public.workspaces   enable row level security;
alter table public.profiles     enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.leads        enable row level security;
alter table public.mpesa_topups enable row level security;

-- workspaces
drop policy if exists workspaces_admin_all     on public.workspaces;
drop policy if exists workspaces_client_select on public.workspaces;
create policy workspaces_admin_all on public.workspaces
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- No client SELECT policy on workspaces: the table holds agency-internal fields
-- (target CPL, close rate, fleet cap, phase, ops_state). Clients read their own
-- workspace through public.client_workspace(), which returns client-safe columns only.

create or replace function public.client_workspace()
returns table (
  id                  uuid,
  name                text,
  domain              text,
  currency            text,
  daily_budget        numeric,
  vat_rate            numeric,
  offer_name          text,
  aov                 numeric,
  gross_margin        numeric,
  deposit_pct         numeric,
  last_synced_at      timestamptz,
  prepaid_spend       numeric,
  prepaid_spend_since date,
  created_at          timestamptz
)
language sql stable security definer
set search_path = public
as $$
  select w.id, w.name, w.domain, w.currency, w.daily_budget, w.vat_rate, w.offer_name,
         w.aov, w.gross_margin, w.deposit_pct, w.last_synced_at, w.prepaid_spend,
         w.prepaid_spend_since, w.created_at
  from public.workspaces w
  where w.id = public.my_workspace_id();
$$;

revoke all on function public.client_workspace() from public;
grant execute on function public.client_workspace() to authenticated;

-- profiles
drop policy if exists profiles_admin_all     on public.profiles;
drop policy if exists profiles_client_select on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Non-admins can read only their own profile (no co-worker names or emails).
create policy profiles_client_select on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- ad_creatives
drop policy if exists ad_creatives_admin_all     on public.ad_creatives;
drop policy if exists ad_creatives_client_select on public.ad_creatives;
create policy ad_creatives_admin_all on public.ad_creatives
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ad_creatives_client_select on public.ad_creatives
  for select to authenticated using (workspace_id = public.my_workspace_id());

-- leads
drop policy if exists leads_admin_all     on public.leads;
drop policy if exists leads_client_select on public.leads;
drop policy if exists leads_client_update on public.leads;
create policy leads_admin_all on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy leads_client_select on public.leads
  for select to authenticated using (workspace_id = public.my_workspace_id());
create policy leads_client_update on public.leads
  for update to authenticated
  using (workspace_id = public.my_workspace_id())
  with check (workspace_id = public.my_workspace_id());

-- mpesa_topups
drop policy if exists topups_admin_all     on public.mpesa_topups;
drop policy if exists topups_client_select on public.mpesa_topups;
create policy topups_admin_all on public.mpesa_topups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy topups_client_select on public.mpesa_topups
  for select to authenticated using (workspace_id = public.my_workspace_id());

-- ----------------------------------------------------------------------------
-- Seed
-- ----------------------------------------------------------------------------

insert into public.workspaces (
  name, domain, meta_ad_account_id, currency, daily_budget, vat_rate, offer_name,
  aov, gross_margin, target_cpl, close_rate, deposit_pct, phase, fleet_cap_monthly
)
select
  'Krescent Adventures', 'krescentadventures.com', '384434063915420', 'KES', 200, 0.16,
  '4x4 Nissan Safari Van Hire (7-Seater + Guide)',
  90000, 0.50, 350, 0.10, 0.30, 'Phase 2: Buy Data', 8
where not exists (
  select 1 from public.workspaces where meta_ad_account_id = '384434063915420'
);
