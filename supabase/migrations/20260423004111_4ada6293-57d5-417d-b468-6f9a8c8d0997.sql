-- 1. App roles enum and user_roles table (separate from profiles, per security best practice)
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to safely check roles inside RLS without recursion
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- RLS: anyone authenticated can read their own roles; only admins can manage roles
create policy "Users view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 2. Add an "unlimited" plan tier for admin / comp accounts
insert into public.subscription_plans (
  slug, name, description,
  price_usd_cents, price_ngn_kobo,
  monthly_jobs, monthly_loras, monthly_images,
  watermark, priority_queue, features, sort_order, is_active
) values (
  'unlimited', 'Unlimited', 'Internal / admin tier',
  0, 0,
  999999, 999999, 999999,
  false, true,
  '["Unlimited everything", "Priority queue", "Admin tools"]'::jsonb,
  99, false   -- is_active=false so it never shows in pricing UI
);