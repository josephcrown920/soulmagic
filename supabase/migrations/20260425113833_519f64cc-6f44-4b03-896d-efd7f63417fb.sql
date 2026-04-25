-- Helper: grant admin to a user by email (idempotent)
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Auto-promote table for pending admin emails
CREATE TABLE IF NOT EXISTS public.pending_admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pending admins"
ON public.pending_admin_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed the 3 emails
INSERT INTO public.pending_admin_emails (email) VALUES
  ('josephluckycrown@gmail.com'),
  ('outthemudrecordsltd@gmail.com'),
  ('josephpaxful@gmail.com')
ON CONFLICT DO NOTHING;

-- Trigger: when a new user signs up, auto-promote if their email is in the pending list
CREATE OR REPLACE FUNCTION public.auto_promote_pending_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.pending_admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_promote_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_promote_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_promote_pending_admin();

-- Immediately promote any of the 3 that already exist
SELECT public.grant_admin_by_email('josephluckycrown@gmail.com');
SELECT public.grant_admin_by_email('outthemudrecordsltd@gmail.com');
SELECT public.grant_admin_by_email('josephpaxful@gmail.com');