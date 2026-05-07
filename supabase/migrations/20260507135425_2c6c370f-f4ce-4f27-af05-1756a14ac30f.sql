CREATE TABLE IF NOT EXISTS public.replicate_spend_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  lora_id uuid,
  kind text NOT NULL DEFAULT 'training',
  estimated_usd numeric(10,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_replicate_spend_log_created_at
  ON public.replicate_spend_log (created_at);

ALTER TABLE public.replicate_spend_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view spend log" ON public.replicate_spend_log;
CREATE POLICY "Admins view spend log"
  ON public.replicate_spend_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.replicate_spend_today_usd()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(estimated_usd), 0)::numeric
  FROM public.replicate_spend_log
  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
$$;