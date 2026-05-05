
INSERT INTO public.pending_admin_emails (email) VALUES ('josephcrown920@gmail.com'), ('josephluckycrown@gmail.com') ON CONFLICT DO NOTHING;
SELECT public.grant_admin_by_email('josephcrown920@gmail.com');
SELECT public.grant_admin_by_email('josephluckycrown@gmail.com');
