create table if not exists public.soul_video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  soul_id uuid not null references public.souls(id) on delete cascade,
  provider text not null default 'seedance',
  model text not null default 'seedance-2.5',
  provider_job_id text,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  prompt text not null,
  duration integer not null default 10 check (duration between 5 and 30),
  aspect_ratio text not null default '16:9',
  reference_count integer not null default 0,
  output_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists soul_video_jobs_user_idx on public.soul_video_jobs(user_id, created_at desc);
create index if not exists soul_video_jobs_soul_idx on public.soul_video_jobs(soul_id, created_at desc);

alter table public.soul_video_jobs enable row level security;
create policy "Users can view their own Soul video jobs" on public.soul_video_jobs for select using (auth.uid() = user_id);
create policy "Users can create their own Soul video jobs" on public.soul_video_jobs for insert with check (auth.uid() = user_id);
create policy "Users can update their own Soul video jobs" on public.soul_video_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_soul_video_jobs_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists soul_video_jobs_updated_at on public.soul_video_jobs;
create trigger soul_video_jobs_updated_at before update on public.soul_video_jobs for each row execute function public.set_soul_video_jobs_updated_at();
