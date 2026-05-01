ALTER TABLE public.loras
ADD COLUMN IF NOT EXISTS quality TEXT NOT NULL DEFAULT 'standard'
CHECK (quality IN ('standard', 'pro'));