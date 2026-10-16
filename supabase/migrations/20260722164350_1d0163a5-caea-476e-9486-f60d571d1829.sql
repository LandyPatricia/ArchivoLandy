
CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_if_first() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;
