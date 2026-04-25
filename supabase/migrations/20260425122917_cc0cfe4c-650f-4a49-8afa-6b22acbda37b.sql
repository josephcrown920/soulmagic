-- Wallet addresses table
CREATE TABLE public.crypto_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network text NOT NULL,           -- e.g. 'ethereum'
  coin text NOT NULL,              -- e.g. 'USDC', 'USDT'
  address text NOT NULL,
  memo text,                       -- optional tag/memo for chains that need it
  label text,                      -- e.g. 'Bybit USDC ERC20'
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active wallets are public"
  ON public.crypto_wallets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage wallets"
  ON public.crypto_wallets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_crypto_wallets_updated_at
  BEFORE UPDATE ON public.crypto_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend crypto_payments for manual TX-hash flow
ALTER TABLE public.crypto_payments
  ADD COLUMN tx_hash text,
  ADD COLUMN network text,
  ADD COLUMN coin text,
  ADD COLUMN wallet_id uuid REFERENCES public.crypto_wallets(id),
  ADD COLUMN admin_notes text,
  ADD COLUMN reviewed_at timestamp with time zone,
  ADD COLUMN reviewed_by uuid;

-- Allow users to submit their own payment claims
CREATE POLICY "Users insert own crypto payments"
  ON public.crypto_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view & manage all payments
CREATE POLICY "Admins view all crypto payments"
  ON public.crypto_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update crypto payments"
  ON public.crypto_payments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed placeholder rows so admin can edit them in-app
INSERT INTO public.crypto_wallets (network, coin, address, label, sort_order, is_active)
VALUES
  ('ethereum', 'USDC', '0xREPLACE_WITH_YOUR_BYBIT_USDC_ADDRESS', 'Bybit USDC (ERC-20)', 1, false),
  ('ethereum', 'USDT', '0xREPLACE_WITH_YOUR_BYBIT_USDT_ADDRESS', 'Bybit USDT (ERC-20)', 2, false);