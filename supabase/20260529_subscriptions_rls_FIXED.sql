-- ============================================================================
-- POLÍTICAS RLS PARA TABELA SUBSCRIPTIONS - VERSÃO CORRIGIDA
-- Data: 2026-05-29
-- Correção: Usa public.has_role e public.is_super_admin para o modelo de roles do projeto
-- ============================================================================

-- Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "user_read_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "user_create_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "admin_update_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "admin_delete_subscriptions" ON public.subscriptions;

-- Assegurar que RLS está ativado na tabela subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. POLÍTICA: Admins e super_admins podem ler e gerenciar TODAS as assinaturas
-- ============================================================================
CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- 2. POLÍTICA: Utilizadores (técnicos) podem ler SUAS PRÓPRIAS assinaturas
-- ============================================================================
CREATE POLICY "user_read_own_subscriptions" ON public.subscriptions
FOR SELECT
USING (
  owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- 3. POLÍTICA: Técnicos podem criar SUAS PRÓPRIAS assinaturas
-- ============================================================================
CREATE POLICY "user_create_own_subscriptions" ON public.subscriptions
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND status = 'pending'
);

-- ============================================================================
-- 4. POLÍTICA: APENAS ADMINS e super_admins podem atualizar assinaturas
-- ============================================================================
CREATE POLICY "admin_update_subscriptions" ON public.subscriptions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- 5. POLÍTICA: APENAS ADMINS e super_admins podem deletar assinaturas
-- ============================================================================
CREATE POLICY "admin_delete_subscriptions" ON public.subscriptions
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- VERIFICAÇÃO: Confirmar que todas as políticas foram criadas
-- ============================================================================
SELECT * FROM pg_policies WHERE tablename = 'subscriptions' ORDER BY policyname;
