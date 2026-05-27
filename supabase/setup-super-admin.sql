-- ============================================================
-- SUPER ADMIN SETUP SCRIPT
-- Execute este script para configurar o Super Admin inicial
-- ============================================================

-- PASSO 1: Encontrar o user_id do email específico
-- Você precisa executar isto DEPOIS de o utilizador se registar via Supabase Auth
-- Substitua o email abaixo pelo email do Super Admin

-- SELECT id FROM auth.users WHERE email = 'Miltonfernandoalfredo@gmail.com';

-- PASSO 2: Copie o ID retornado e substitua <USER_ID> abaixo

-- Adicionar role de admin
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('<USER_ID>', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Adicionar como super admin
-- INSERT INTO public.super_admins (user_id)
-- VALUES ('<USER_ID>')
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO
-- Execute isto para verificar se o Super Admin foi configurado

-- SELECT 
--   u.email,
--   ur.role,
--   sa.id as is_super_admin
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id
-- LEFT JOIN public.super_admins sa ON u.id = sa.user_id
-- WHERE u.email = 'Miltonfernandoalfredo@gmail.com';

-- Resultado esperado:
-- email                        | role  | is_super_admin
-- Miltonfernandoalfredo@...   | admin | <numero>
