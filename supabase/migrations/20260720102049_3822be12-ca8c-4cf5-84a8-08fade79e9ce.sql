
-- 1) Profiles: add INSERT policy scoped to self
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2) Storage: allow anonymous reads for public-assets bucket
DROP POLICY IF EXISTS "public-assets anon read" ON storage.objects;
CREATE POLICY "public-assets anon read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-assets');

-- 3) Revoke EXECUTE on SECURITY DEFINER helpers from anon / authenticated
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_subscription_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_premium_flag() FROM PUBLIC, anon, authenticated;

-- 4) Column-level restriction: hide phone_whatsapp from anonymous SELECT
REVOKE SELECT ON public.technicians FROM anon;
GRANT SELECT
  (id, full_name, profile_photo_url, years_experience, bio,
   is_verified, is_premium, is_banned, created_at, updated_at)
  ON public.technicians TO anon;

REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT
  (id, company_name, logo_url, bio,
   is_verified, is_banned, created_at, updated_at)
  ON public.companies TO anon;

-- 5) Public RPC that returns WhatsApp only when contact is unlocked
CREATE OR REPLACE FUNCTION public.get_public_whatsapp(_owner_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_verified boolean;
  v_premium boolean;
  v_banned boolean;
  v_active boolean;
BEGIN
  -- Try technicians
  SELECT phone_whatsapp, is_verified, is_premium, is_banned
    INTO v_phone, v_verified, v_premium, v_banned
    FROM public.technicians WHERE id = _owner_id;

  IF FOUND THEN
    IF v_banned THEN RETURN NULL; END IF;
    v_active := public.has_active_subscription(_owner_id);
    IF (v_verified AND v_premium) OR v_active THEN
      RETURN v_phone;
    END IF;
    RETURN NULL;
  END IF;

  -- Fallback to companies
  SELECT phone_whatsapp, is_verified, is_banned
    INTO v_phone, v_verified, v_banned
    FROM public.companies WHERE id = _owner_id;

  IF FOUND THEN
    IF v_banned THEN RETURN NULL; END IF;
    v_active := public.has_active_subscription(_owner_id);
    IF v_verified OR v_active THEN
      RETURN v_phone;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_whatsapp(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_whatsapp(uuid) TO anon, authenticated;
