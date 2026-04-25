-- Crypto payments tracking (NOWPayments)
CREATE TABLE public.crypto_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_slug text NOT NULL,
  nowpayments_invoice_id text,
  nowpayments_payment_id text,
  pay_address text,
  pay_currency text,
  pay_amount numeric,
  price_amount numeric NOT NULL,
  price_currency text NOT NULL DEFAULT 'USD',
  order_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'waiting',
  raw jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_crypto_payments_user ON public.crypto_payments(user_id);
CREATE INDEX idx_crypto_payments_invoice ON public.crypto_payments(nowpayments_invoice_id);
CREATE INDEX idx_crypto_payments_payment ON public.crypto_payments(nowpayments_payment_id);

ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own crypto payments"
  ON public.crypto_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER update_crypto_payments_updated_at
  BEFORE UPDATE ON public.crypto_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Track music ad / sponsored track config so it can be edited later from an admin UI
CREATE TABLE public.sponsored_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  cover_url text,
  link_url text NOT NULL,
  tag text NOT NULL DEFAULT 'Sponsored',
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsored tracks are publicly readable"
  ON public.sponsored_tracks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage sponsored tracks"
  ON public.sponsored_tracks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_sponsored_tracks_updated_at
  BEFORE UPDATE ON public.sponsored_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the current "The One" track
INSERT INTO public.sponsored_tracks (title, artist, link_url, tag, is_active)
VALUES (
  'The One',
  'NBA Josh x R3NEGAD3',
  'https://open.spotify.com/track/1NGJQfOSZ2M9JSarl80KmG?si=Ghi00yDASF-FvIkTpS467w',
  'Sponsored',
  true
);