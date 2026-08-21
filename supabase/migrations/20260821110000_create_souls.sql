create table if not exists public.souls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'pending' check (status in ('pending','training','ready','failed')),
  provider text not null default 'fal',
  trainer_model text not null default 'fal-ai/flux-lora-portrait-trainer',
  trigger_phrase text not null default 'aurorasoul',
  training_image_paths text[] not null default '{}',
  lora_url text,
  config_url text,
  training_request_id text,
  progress integer not null default 0 check (progress between 0 and 100),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists souls_user_id_idx on public.souls(user_id);
create index if not exists souls_status_idx on public.souls(status);

alter table public.souls enable row level security;

create policy "Users can view their own souls"
  on public.souls for select
  using (auth.uid() = user_id);

create policy "Users can create their own souls"
  on public.souls for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own souls"
  on public.souls for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own souls"
  on public.souls for delete
  using (auth.uid() = user_id);

create or replace function public.set_souls_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists souls_updated_at on public.souls;
create trigger souls_updated_at
before update on public.souls
for each row execute function public.set_souls_updated_at();

-- Keep trained weights private. Only the service role should write training artifacts.
