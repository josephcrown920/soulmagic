-- Plans catalog (public read)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_usd_cents INTEGER NOT NULL DEFAULT 0,
  price_ngn_kobo INTEGER NOT NULL DEFAULT 0,
  paystack_plan_code_usd TEXT,
  paystack_plan_code_ngn TEXT,
  monthly_jobs INTEGER NOT NULL DEFAULT 0,
  monthly_loras INTEGER NOT NULL DEFAULT 0,
  monthly_images INTEGER NOT NULL DEFAULT 0,
  watermark BOOLEAN NOT NULL DEFAULT true,
  priority_queue BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE TRIGGER trg_plans_updated
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the three tiers
INSERT INTO public.subscription_plans
  (slug, name, description, price_usd_cents, price_ngn_kobo,
   monthly_jobs, monthly_loras, monthly_images, watermark, priority_queue, features, sort_order)
VALUES
  ('free', 'Free', 'Try the studio with watermarked outputs.',
   0, 0, 1, 0, 5, true, false,
   '["1 video job per month","5 image generations","Watermarked outputs","Community presets"]'::jsonb, 1),
  ('pro', 'Pro', 'For solo creators shipping content weekly.',
   1900, 2900000, 30, 1, 200, false, false,
   '["30 video jobs / month","1 LoRA training","200 image generations","No watermark","Custom presets"]'::jsonb, 2),
  ('studio', 'Studio', 'For studios and power users.',
   4900, 7500000, 200, 5, 2000, false, true,
   '["200 video jobs / month","5 LoRA trainings","2,000 image generations","Priority queue","Scene/outfit pass","Vibe matching"]'::jsonb, 3);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_slug TEXT NOT NULL DEFAULT 'free' REFERENCES public.subscription_plans(slug),
  status TEXT NOT NULL DEFAULT 'active',
  currency TEXT NOT NULL DEFAULT 'USD',
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  paystack_email_token TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_subs_updated
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subs_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_subs_paystack_code ON public.user_subscriptions(paystack_subscription_code);

-- Usage counters (one row per user per month)
CREATE TABLE public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  jobs_processed INTEGER NOT NULL DEFAULT 0,
  loras_trained INTEGER NOT NULL DEFAULT 0,
  images_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
ON public.usage_counters FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER trg_usage_updated
BEFORE UPDATE ON public.usage_counters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Paystack webhook event log (admin/server only)
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paystack_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  user_id UUID,
  reference TEXT,
  amount INTEGER,
  currency TEXT,
  raw JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service role accesses this table

CREATE INDEX idx_pay_events_user ON public.payment_events(user_id);
CREATE INDEX idx_pay_events_ref ON public.payment_events(reference);

-- Helper: resolve current plan for a user (defaults to 'free')
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan_slug
     FROM public.user_subscriptions
     WHERE user_id = _user_id
       AND status IN ('active','trialing','non-renewing')
       AND (current_period_end IS NULL OR current_period_end > now())
     LIMIT 1),
    'free'
  );
$$;

-- Helper: get or create the current month usage counter
CREATE OR REPLACE FUNCTION public.get_or_create_usage_counter(_user_id UUID)
RETURNS public.usage_counters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period DATE := date_trunc('month', now())::date;
  _row public.usage_counters;
BEGIN
  INSERT INTO public.usage_counters (user_id, period_start)
  VALUES (_user_id, _period)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  SELECT * INTO _row
  FROM public.usage_counters
  WHERE user_id = _user_id AND period_start = _period;

  RETURN _row;
END;
$$;

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_slug, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Backfill subscriptions for any existing users
INSERT INTO public.user_subscriptions (user_id, plan_slug, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;