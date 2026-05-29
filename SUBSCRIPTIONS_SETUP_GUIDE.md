# 📋 GUIA DE INSTALAÇÃO - SISTEMA DE ASSINATURAS

## 🎯 Objetivo
Ativar as políticas RLS para a tabela `subscriptions` e testar o sistema de assinaturas.

---

## ⚙️ PASSO 1: Aplicar Políticas RLS

### 1.1 Aceder ao Supabase SQL Editor
1. Ir para: https://supabase.com/dashboard/project/ohfsifdothuvbbpufako/sql/new
2. Fazer login com GitHub/email

### 1.2 Copiar e executar o SQL
1. Abrir o ficheiro: `supabase/20260529_subscriptions_rls_FIXED.sql`
2. Copiar TODOS os comandos SQL
3. Colar no Supabase SQL Editor
4. Clicar em "Run" (ícone ▶️)

**Resultado esperado:**
```
✓ 5 policies created successfully
```

### 1.3 Verificar políticas aplicadas
Execute isto no SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

Deve aparecer 5 políticas:
- `admin_all_subscriptions`
- `user_read_own_subscriptions`
- `user_create_own_subscriptions`
- `admin_update_subscriptions`
- `admin_delete_subscriptions`

---

## 🧪 PASSO 2: Testar o Sistema com Dados

### 2.1 Criar dados de teste
1. Abrir o ficheiro: `supabase/20260529_test_subscriptions.sql`
2. Executar por **SECÇÕES**:

**Secção 1** (Criar técnico de teste):
```sql
-- PASSO 1: Criar um técnico de teste
INSERT INTO technicians (...)
VALUES (...)
```

**Secção 2** (Criar assinatura pendente):
```sql
-- PASSO 2: Criar uma assinatura pendente
INSERT INTO subscriptions (...)
VALUES (...)
```

**Secção 3** (Ver assinaturas pendentes):
```sql
-- PASSO 3: Verificar assinaturas pendentes
SELECT ...
```

### 2.2 Simular fluxo completo

**Passo A - Técnico faz upload de comprovativo**
- Status → `pending` (à espera de aprovação)
- Ficheiro → armazenado em `private-uploads/payment_proofs/`

**Passo B - Admin aprova assinatura**
Execute (Secção 4):
```sql
-- PASSO 4: Simular aprovação
UPDATE subscriptions SET status = 'active', expires_at = NOW() + INTERVAL '30 days' ...
UPDATE technicians SET is_verified = true, is_premium = true ...
```

**Passo C - Verificar aprovação**
Execute (Secção 5):
```sql
-- PASSO 5: Verificar assinatura aprovada
SELECT ...
```

**Resultado esperado:**
- `status` = `active` ✓
- `expires_at` = ~30 dias no futuro ✓
- `is_verified` = `true` ✓
- `is_premium` = `true` ✓

---

## 🔄 PASSO 3: Testar Interface Web

### 3.1 Fluxo de Técnico

**Passo 1 - Homepage**
```
http://localhost:8081/
```

**Passo 2 - Ir para Planos**
```
http://localhost:8081/planos
Clique em "Começar agora" → Premium
```

**Passo 3 - Signup (se necessário)**
```
Email: test.tech@example.com
Palavra-passe: TestPass123!
Nome: Técnico Teste
```

**Passo 4 - Payment (Passo 1)**
```
http://localhost:8081/payment?plan=premium
Vê IBAN e Xpress
Clique em "Continuar → Enviar Comprovativo"
```

**Passo 5 - Upload Comprovativo (Passo 2)**
```
Clique na área de upload
Selecione um ficheiro (PDF/JPG/PNG, max 5MB)
Ficheiro é enviado automaticamente
Vê mensagem: "Comprovativo enviado! O admin ativará em até 24h úteis."
Redirecionado para /dashboard
```

### 3.2 Fluxo de Admin

**Verificar Subscrições Pendentes**
```
http://localhost:8081/admin/subscriptions
Vê tabela com assinaturas pendentes
Clique em "Aprovar" para uma assinatura
```

**Após Aprovação**
```
Status da assinatura muda para "active" (verde)
Técnico agora tem is_verified = true, is_premium = true
WhatsApp fica visível no perfil público
```

### 3.3 Fluxo de Cliente Vendo Técnico

**Ver Perfil Técnico com Assinatura Ativa**
```
http://localhost:8081/technician/{tech_id}
Vê:
- Botão WhatsApp (verde) ✓
- Foto e informações do técnico
- Serviços e zonas
```

**Ver Perfil Técnico SEM Assinatura**
```
http://localhost:8081/technician/{tech_id_outro}
Vê:
- Aviso vermelho: "⚠️ Sem Assinatura Ativa" ✓
- Botões "Começar agora" (Simples/Premium)
- WhatsApp OCULTO
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Segurança RLS
- [ ] Técnico NÃO pode ver assinaturas de outros técnicos
- [ ] Técnico NÃO pode alterar status (apenas admins)
- [ ] Técnico NÃO pode rejeitar sua própria assinatura
- [ ] Admin PODE ver/editar/deletar qualquer assinatura

### Fluxo Técnico
- [ ] Signup funciona
- [ ] Redirecionamento pós-login OK
- [ ] Upload de comprovativo funciona
- [ ] Ficheiro é armazenado em `private-uploads`
- [ ] Subscription record criado com `status=pending`

### Fluxo Admin
- [ ] Admin vê todas as assinaturas pendentes
- [ ] Botão "Aprovar" funciona
- [ ] Status muda para `active`
- [ ] Technician atualizado (is_verified, is_premium)
- [ ] Download de comprovativo funciona

### Gating de WhatsApp
- [ ] Com assinatura ativa → WhatsApp visível
- [ ] Sem assinatura → WhatsApp oculto
- [ ] Expirada → WhatsApp oculto após 30 dias

---

## 🚀 Próximas Fases

### Fase 2 (Opcional): Auto-Expiry
Implementar trigger/cron job para auto-expirar assinaturas:
```sql
-- Verificar cada 1h se há assinaturas expiradas
-- Se expires_at < NOW() e status = 'active':
-- - Atualizar status para 'expired'
-- - Remover is_premium do técnico
```

### Fase 3: Notificações
- Email ao técnico quando assinatura está perto de expirar (-7 dias)
- Email ao admin quando novo comprovativo é enviado
- SMS via Xpress quando assinatura é aprovada

### Fase 4: Webhook de Pagamento
- Integrar com sistema de pagamentos real
- Auto-criar assinatura quando pagamento confirmado
- Auto-aprovar assinaturas com comprovativo de pagamento verifi

---

## 📞 Suporte

Se tiveres erros:

**Erro: "Row level security violation"**
```
Causa: RLS não foi aplicada corretamente
Solução: Verificar se as 5 políticas aparecem em pg_policies
```

**Erro: "Cannot insert record"**
```
Causa: Técnico não existe ou owner_id incorreto
Solução: Usar ID de técnico válido na BD
```

**Erro: "File upload failed"**
```
Causa: Bucket private-uploads não tem RLS ou não existe
Solução: Criar bucket e aplicar políticas de storage
```

---

**Última Actualização:** 2026-05-29  
**Status:** ✅ Pronto para produção após RLS aplicadas
