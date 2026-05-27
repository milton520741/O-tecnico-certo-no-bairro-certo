-- ============================================================
-- MIGRATION: Assign Super Admin Role to Existing User
-- ============================================================

-- Insert role into user_roles (assume role column exists)
INSERT INTO public.user_roles (user_id, role)
VALUES ('f265656f-fadf-4128-8ca8-2e67d3148535', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Insert into super_admins table
INSERT INTO public.super_admins (user_id)
VALUES ('f265656f-fadf-4128-8ca8-2e67d3148535')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
