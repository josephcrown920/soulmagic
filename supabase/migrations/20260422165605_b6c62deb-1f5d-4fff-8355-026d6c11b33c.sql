ALTER TABLE public.presets
ADD COLUMN IF NOT EXISTS scene_outfit_pass boolean NOT NULL DEFAULT false;