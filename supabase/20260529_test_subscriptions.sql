-- ============================================================================
-- TESTES DO SISTEMA DE ASSINATURAS
-- Data: 2026-05-29
-- Objetivo: Criar dados de teste para validar fluxo completo
-- ============================================================================

-- ============================================================================
-- PASSO 1: Criar um técnico de teste com assinatura
-- ============================================================================

-- Insira um técnico de teste (se não existir)
INSERT INTO technicians (
  id,
  full_name,
  phone_whatsapp,
  bio,
  years_experience,
  is_verified,
  is_premium,
  is_banned,
  profile_photo_url
) VALUES (
  'test-tech-001',
  'Técnico de Teste Premium',
  '+244947470500',
  'Técnico testando o sistema de assinaturas',
  5,
  false,
  false,
  false,
  null
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PASSO 2: Criar uma assinatura pendente de teste
-- ============================================================================

INSERT INTO subscriptions (
  owner_id,
  plan,
  file_path,
  status,
  note,
  expires_at
) VALUES (
  'test-tech-001',
  'premium',
  'payment_proofs/test-tech-001/1780051278000-test-proof.pdf',
  'pending',
  'Teste de assinatura Premium - verificar funcionalidade',
  null
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASSO 3: Verificar assinaturas pendentes
-- ============================================================================

SELECT 
  s.id,
  s.owner_id,
  s.plan,
  s.status,
  s.file_path,
  s.created_at,
  s.expires_at,
  t.full_name,
  t.phone_whatsapp
FROM subscriptions s
LEFT JOIN technicians t ON s.owner_id = t.id
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;

-- ============================================================================
-- PASSO 4: Simular aprovação de assinatura (ADMIN ONLY)
-- ============================================================================

-- Aprover a assinatura de teste (válida por 30 dias)
UPDATE subscriptions
SET 
  status = 'active',
  expires_at = NOW() + INTERVAL '30 days'
WHERE 
  owner_id = 'test-tech-001' 
  AND status = 'pending'
  AND plan = 'premium';

-- Atualizar técnico para marcar como verificado e premium
UPDATE technicians
SET 
  is_verified = true,
  is_premium = true
WHERE 
  id = 'test-tech-001';

-- ============================================================================
-- PASSO 5: Verificar assinatura aprovada
-- ============================================================================

SELECT 
  s.id,
  s.owner_id,
  s.plan,
  s.status,
  s.expires_at,
  NOW() < s.expires_at as "Is Active",
  t.full_name,
  t.is_verified,
  t.is_premium,
  t.phone_whatsapp
FROM subscriptions s
LEFT JOIN technicians t ON s.owner_id = t.id
WHERE s.owner_id = 'test-tech-001';

-- ============================================================================
-- PASSO 6: Testar expiração automática (quando NOW() > expires_at)
-- ============================================================================

-- Simular expiração criando uma assinatura que já expirou
INSERT INTO subscriptions (
  owner_id,
  plan,
  file_path,
  status,
  note,
  expires_at
) VALUES (
  'test-tech-001',
  'simples',
  'payment_proofs/test-tech-001/1780050000000-old-proof.pdf',
  'active',
  'Assinatura expirada (teste)',
  NOW() - INTERVAL '1 day'  -- Expirou há 1 dia
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASSO 7: Verificar assinaturas expiradas
-- ============================================================================

SELECT 
  s.id,
  s.plan,
  s.status,
  s.expires_at,
  CASE WHEN NOW() > s.expires_at THEN 'EXPIRADA' ELSE 'ATIVA' END as status_real
FROM subscriptions s
WHERE s.owner_id = 'test-tech-001'
ORDER BY s.expires_at DESC;

-- ============================================================================
-- PASSO 8: Atualizar assinaturas expiradas para status 'expired'
-- ============================================================================

UPDATE subscriptions
SET status = 'expired'
WHERE status = 'active' 
  AND expires_at IS NOT NULL
  AND NOW() > expires_at;

-- Remover premium/verified se todas as assinaturas premium expiraram
UPDATE technicians
SET is_premium = false
WHERE id IN (
  SELECT DISTINCT owner_id 
  FROM subscriptions 
  WHERE plan = 'premium' 
    AND status = 'expired'
)
AND NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE owner_id = technicians.id 
    AND plan = 'premium' 
    AND status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
);

-- ============================================================================
-- RESUMO DO TESTE
-- ============================================================================

-- Ver status final de tudo
SELECT 
  'ASSINATURAS' as tipo,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as ativas,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendentes,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejeitadas,
  SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expiradas
FROM subscriptions;
