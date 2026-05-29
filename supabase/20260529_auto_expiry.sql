-- ============================================================================
-- AUTO-EXPIRAÇÃO DE ASSINATURAS
-- Data: 2026-05-29
-- Objetivo: Atualizar automaticamente assinaturas expiradas
-- ============================================================================

-- ============================================================================
-- OPÇÃO 1: TRIGGER PostgreSQL (Recomendado)
-- Executado: Sempre que uma subscription é verificada
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_expired_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o expires_at passou e a assinatura ainda está ativa
  IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    
    -- Se era premium, remover flag is_premium do técnico
    IF NEW.plan = 'premium' THEN
      UPDATE technicians 
      SET is_premium = false
      WHERE id = NEW.owner_id
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE owner_id = NEW.owner_id 
          AND plan = 'premium' 
          AND status = 'active' 
          AND (expires_at IS NULL OR expires_at > NOW())
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa a função
DROP TRIGGER IF EXISTS check_subscription_expiry ON subscriptions;
CREATE TRIGGER check_subscription_expiry
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION expire_expired_subscriptions();

-- ============================================================================
-- OPÇÃO 2: Verificação Agendada (pg_cron)
-- Executado: A cada 1 hora (ou intervalo configurado)
-- ============================================================================

-- Se pg_cron não está instalado, instalar primeiro:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job agendado para verificar e expirar assinaturas
SELECT cron.schedule(
  'expire_old_subscriptions',
  '0 * * * *',  -- A cada hora (HH:00)
  $$
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at IS NOT NULL
    AND NOW() > expires_at;
  
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
  $$
);

-- ============================================================================
-- OPÇÃO 3: Verificação no Código (TypeScript)
-- Executado: Quando qualquer código consulta assinaturas
-- ============================================================================

-- Adicionar este código em src/lib/subscriptions-utils.ts:
/*
import { supabase } from "@/integrations/supabase/client";

export async function ensureSubscriptionsExpired() {
  // Atualizar todas as assinaturas que deveriam estar expiradas
  const { data: expiredSubs, error } = await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .select()
    .eq("status", "active")
    .lte("expires_at", new Date().toISOString());

  if (error) {
    console.error("Error expiring subscriptions:", error);
    return;
  }

  if (expiredSubs && expiredSubs.length > 0) {
    const technicianIds = [...new Set(expiredSubs.map((s) => s.owner_id))];

    // Remover is_premium de técnicos que não têm assinatura premium ativa
    for (const techId of technicianIds) {
      const { data: activePremium } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("owner_id", techId)
        .eq("plan", "premium")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (!activePremium || activePremium.length === 0) {
        await supabase
          .from("technicians")
          .update({ is_premium: false })
          .eq("id", techId);
      }
    }
  }
}

// Chamar isto em:
// - src/routes/technician.$id.tsx (antes de renderizar perfil)
// - src/components/admin/AdminSubscriptionsTable.tsx (no onMount)
// - src/routes/dashboard.index.tsx (no onMount)
*/

-- ============================================================================
-- OPÇÃO 4: Cloudflare Workers Cron (Se usando Workers para Deploy)
-- Executado: Em intervalo cronológico via Wrangler
-- ============================================================================

-- Adicionar em wrangler.jsonc:
/*
{
  "env": {
    "production": {
      "routes": [
        { "pattern": "/api/cron/expire-subscriptions", "zone_name": "example.com" }
      ],
      "triggers": {
        "crons": ["0 * * * *"]
      }
    }
  }
}
*/

-- Criar rota em src/routes/api/cron/expire-subscriptions.ts:
/*
import { defineEventHandler } from "h3";
import { supabase } from "@/integrations/supabase/client";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");
  
  // Verificar token secreto
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  await ensureSubscriptionsExpired();
  
  return { success: true, timestamp: new Date().toISOString() };
});
*/

-- ============================================================================
-- TESTES: Verificar Auto-Expiração
-- ============================================================================

-- Test 1: Criar assinatura que expira amanhã
INSERT INTO subscriptions (owner_id, plan, status, expires_at, file_path, note)
VALUES (
  'test-tech-001',
  'premium',
  'active',
  NOW() + INTERVAL '1 day',
  'test_path',
  'Expira amanhã - Teste'
);

-- Test 2: Criar assinatura que JÁ expirou
INSERT INTO subscriptions (owner_id, plan, status, expires_at, file_path, note)
VALUES (
  'test-tech-001',
  'simples',
  'active',
  NOW() - INTERVAL '1 day',
  'test_path',
  'Expirou há 1 dia - Teste'
);

-- Test 3: Verificar status ANTES de atualizar
SELECT 
  id,
  plan,
  status,
  expires_at,
  NOW() as tempo_actual,
  CASE WHEN expires_at < NOW() THEN 'JÁ EXPIRADA' ELSE 'AINDA ATIVA' END as deveria_ser
FROM subscriptions
WHERE owner_id = 'test-tech-001'
ORDER BY expires_at;

-- Test 4: Simular atualização (trigger dispara)
UPDATE subscriptions 
SET note = 'Trigger deveria ter marcado como expired'
WHERE owner_id = 'test-tech-001' AND expires_at < NOW();

-- Test 5: Verificar status DEPOIS de atualizar
SELECT 
  id,
  plan,
  status,
  expires_at
FROM subscriptions
WHERE owner_id = 'test-tech-001'
ORDER BY expires_at;

-- Resultado esperado:
-- A assinatura com expires_at < NOW() deve ter status = 'expired' ✓

-- ============================================================================
-- LIMPEZA: Remover dados de teste
-- ============================================================================

-- DELETE FROM subscriptions WHERE owner_id = 'test-tech-001' AND note LIKE '%Teste%';

-- ============================================================================
-- RECOMENDAÇÃO FINAL
-- ============================================================================

-- ESCOLHA UMA OPÇÃO:
-- 
-- ✅ PRODUÇÃO: Usar Opção 1 (Trigger) + Opção 2 (pg_cron)
--    → Mais confiável, executado automaticamente pelo PostgreSQL
--    → Não depende de código external
--    → Testa direto no BD
--
-- ✅ ALTERNATIVA: Usar Opção 3 (TypeScript)
--    → Mais controlo no código
--    → Adiciona 1-2ms ao tempo de request
--    → Precisa ser chamado em pontos-chave
--
-- ❌ NÃO RECOMENDADO: Opção 4 (Workers Cron)
--    → Apenas se workers não têm acesso à BD
--    → Requer token/secret adicional
--    → Menos confiável

-- Para este projeto (TanStack Start + Supabase): Use OPÇÃO 1 + OPÇÃO 2
