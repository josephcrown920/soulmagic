alter table public.souls
  add column if not exists identity_mode text not null default 'lora'
    check (identity_mode in ('lora','reference','hybrid')),
  add column if not exists reference_image_paths text[] not null default '{}',
  add column if not exists reference_profile jsonb not null default '{}'::jsonb,
  add column if not exists version integer not null default 1;

create index if not exists souls_identity_mode_idx on public.souls(identity_mode);

comment on column public.souls.identity_mode is 'Aurora Soul identity strategy: lora, reference, or hybrid.';
comment on column public.souls.reference_image_paths is 'Curated identity reference images used by the V2 reference pipeline.';
comment on column public.souls.reference_profile is 'Non-sensitive generation metadata for reference identity routing.';
