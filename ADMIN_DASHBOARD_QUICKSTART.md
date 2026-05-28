# 🚀 Admin Dashboard - Quick Start

## ✅ Checklist Pre-Deploy

- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations Supabase executadas
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript sem erros (`npm run typecheck`)

---

## 📦 Instalação

### 1. Atualizar Dependências
```bash
npm install
# ou
bun install
```

### 2. Verificar Build
```bash
npm run build
```

### 3. Verificar TypeScript
```bash
npm run typecheck
# ou
tsc --noEmit
```

---

## 🗄️ Database Setup

### Criar Tabelas (se ainda não existem)

```sql
-- Payment Proofs Table
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount INT NOT NULL, -- em Kzanzas
  proof_url TEXT NOT NULL, -- URL da imagem
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_data JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_subscription_id ON payment_proofs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
```

---

## 🌐 Ambiente de Desenvolvimento

### 1. Iniciar Dev Server
```bash
npm run dev
```

### 2. Acessar Admin
```
http://localhost:5173/admin
```

### 3. Testar Funcionalidades
- Vai a Dashboard
- Verifica stats
- Navega para Comprovantes
- Testa aprovação/rejeição

---

## 📱 Testar no Seu Dispositivo

### Acesso Remoto (Tunnel)
```bash
npm run dev -- --host
# ou
npx vite --host
```

Acessa: `http://seu-ip:5173/admin`

---

## 🔍 Troubleshooting

### Stats não carregam
```
1. Verifica console.log para erros
2. Verifica se Supabase está configurado
3. Verifica se tabelas existem
4. Verifica RLS policies em Supabase
```

### Comprovantes não aparecem
```
1. Insere test data em payment_proofs
2. Verifica se subscriptions existem
3. Verifica relações entre tabelas
```

### Erros de TypeScript
```
1. npm install
2. npm run typecheck
3. Verifica tipos em admin.ts
```

---

## 📊 Dados de Teste

### Inserir Subscription de Teste
```sql
INSERT INTO subscriptions (
  owner_id, 
  owner_type, 
  plan, 
  status, 
  created_at
) VALUES (
  'user-uuid-here',
  'technician',
  'simples',
  'active',
  now()
);
```

### Inserir Payment Proof de Teste
```sql
INSERT INTO payment_proofs (
  subscription_id,
  amount,
  proof_url,
  status
) VALUES (
  'subscription-uuid-here',
  5000,
  'https://example.com/comprovante.jpg',
  'pending'
);
```

---

## 🚢 Deploy para Produção

### 1. Verificar Variáveis
```bash
# .env.production deve ter:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 2. Build
```bash
npm run build
```

### 3. Testar Build
```bash
npm run preview
```

### 4. Deploy
```bash
# Cloudflare Pages (via wrangler)
npm run deploy

# Ou seu host preferido
git push origin main
```

---

## 🔐 Segurança em Produção

### RLS Policies Recomendadas

```sql
-- Payment Proofs: Apenas admins podem ver/atualizar
CREATE POLICY "admin_read_payment_proofs" ON payment_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_update_payment_proofs" ON payment_proofs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Admin Logs: Apenas para inserção (imutável)
CREATE POLICY "admin_insert_logs" ON admin_logs
  FOR INSERT WITH CHECK (
    admin_id = auth.uid()
  );
```

---

## 📞 Verificação Final

Antes de ir live:

- [ ] Dashboard carrega sem erros
- [ ] Stats mostram números corretos
- [ ] Comprovantes podem ser visualizados
- [ ] Aprovação/rejeição funciona
- [ ] Logs registam ações
- [ ] Links internos funcionam
- [ ] Responsividade OK em mobile
- [ ] Performance OK (load tests)
- [ ] Segurança OK (RLS, autenticação)

---

## 📋 Arquivos Modificados

**Criados:**
- ✅ `src/routes/admin.payment-proofs.tsx`
- ✅ `src/components/admin/AdminPaymentProofsTable.tsx`
- ✅ `ADMIN_DASHBOARD_GUIDE.md`
- ✅ `ADMIN_DASHBOARD_COMPLETION.md`

**Modificados:**
- ✅ `src/routes/admin.index.tsx` (Dashboard completo)
- ✅ `src/routes/admin.reports.tsx` (Melhorado)
- ✅ `src/routes/admin.logs.tsx` (Melhorado)
- ✅ `src/components/admin/index.ts` (Exportação)

---

## 🎯 Próximas Ações

1. **Hoje:**
   - [ ] Commit e push das mudanças
   - [ ] Code review
   - [ ] Deploy para staging

2. **Amanhã:**
   - [ ] Testes QA
   - [ ] Feedback dos admins
   - [ ] Ajustes finais

3. **Production:**
   - [ ] Deploy para live
   - [ ] Monitoramento de erros
   - [ ] Documentação para suporte

---

**Pronto para começar!** 🚀
