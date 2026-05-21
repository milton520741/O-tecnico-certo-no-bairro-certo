
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke public/anon execute on SECURITY DEFINER helpers; only allow authenticated server-side use
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Remove broad public listing on public-assets bucket; replace with object-level read by exact path only
DROP POLICY IF EXISTS "public-assets read" ON storage.objects;
CREATE POLICY "public-assets owner read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'public-assets' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);
-- Note: ficheiros em public-assets continuam acessíveis via URL pública direta (bucket público),
-- mas a listagem/select via API requer ser dono ou admin.
