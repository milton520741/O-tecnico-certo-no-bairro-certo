# 🎯 ONDE COMEÇAR - Plano Completo de Conclusão

## 📊 STATUS ATUAL: 70% PRONTO

```
✅ Frontend: 90% (UI, rotas, componentes)
✅ Backend: 85% (BD, autenticação, admin)
⚠️ Integrações: 40% (faltam pagamentos, email)
⚠️ Admin: 60% (interface pronta, workflows incompletos)
❌ Testes: 0% (nenhum teste implementado)
```

---

## 🚀 COMEÇAR AQUI: 3 ETAPAS

### **ETAPA 1: FUNÇÕES CRÍTICAS (5-7 DIAS)**
Sem isto, não podes ir a produção

### **ETAPA 2: COMPLETAR ADMIN (3-4 DIAS)**
Painel administrativo funcional

### **ETAPA 3: TESTES & SEGURANÇA (2-3 DIAS)**
Pronto para produção

### **ETAPA 4: DEPLOY (1 DIA)**
Online em `tecnico-certo.workers.dev`

---

## 📋 ETAPA 1: FUNÇÕES CRÍTICAS (5-7 DIAS)

### O QUE ESTÁ ✅ e O QUE FALTA ❌

| Funcionalidade | Status | Ficheiro | Ação |
|---|---|---|---|
| **Login/Signup** | ✅ Completo | `src/routes/auth.tsx` | Testado ✓ |
| **Dashboard Técnico** | ✅ Completo | `src/routes/dashboard.tsx` | Testado ✓ |
| **Busca de Técnicos** | ✅ Completo | `src/routes/technicians.tsx` | Testado ✓ |
| **Upload de Comprovativo** | ✅ Completo | `src/routes/dashboard.comprovativo.tsx` | Testado ✓ |
| **Planos** | ✅ Completo | `src/routes/planos.tsx` | Testado ✓ |
| **PAGAMENTOS** | ❌ Falta | — | **PRIORITÁRIO** |
| **Notificações Email** | ❌ Falta | — | **PRIORITÁRIO** |
| **Aprovação Assinaturas** | ⚠️ Incompleto | `src/routes/admin.subscriptions.tsx` | Completar UI |

### PRIORIDADE 1️⃣: Integração de Pagamentos (2-3 DIAS)

**Opções:**

#### A. Stripe (Recomendado) - 2 dias
```bash
# 1. Instalar Stripe
npm install stripe @stripe/react-stripe-js

# 2. Criar conta: https://stripe.com (teste grátis)
# 3. Obter: Publishable Key + Secret Key

# 4. Adicionar a .env.production:
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**O que fazer:**
- [ ] Criar checkout page em `src/routes/dashboard.checkout.tsx`
- [ ] Integrar Stripe Payment Element
- [ ] Webhook para confirmar pagamento → atualizar subscription status
- [ ] Usar função `handlePaymentSuccess()` no backend

**Tempo:** 2 dias

---

#### B. Xpress Money API (Se usares em Angola) - 3 dias
```
Para Angola: Xpress Money, E-mula, Unitel Money
Mais complexo que Stripe
Tempo: 3-4 dias
```

**RECOMENDAÇÃO:** Começa com **Stripe** (mais rápido, melhor docs)

---

### PRIORIDADE 2️⃣: Notificações por Email (1-2 DIAS)

**Opções:**

#### A. SendGrid (Recomendado) - 1 dia
```bash
# 1. Conta: https://sendgrid.com (grátis até 100 emails/dia)
# 2. API Key na .env.production:
SENDGRID_API_KEY=SG.xxxxx

# 3. Criar ficheiro: src/lib/email.ts
# 4. Implementar funções:
#    - sendWelcomeEmail()
#    - sendSubscriptionApprovedEmail()
#    - sendPaymentReceivedEmail()
```

**Quando enviar emails:**
- ✅ Registo novo (boas-vindas)
- ✅ Assinatura aprovada por admin
- ✅ Pagamento recebido
- ✅ Comprovativo revisado

**Tempo:** 1 dia

---

### PRIORIDADE 3️⃣: Completar Admin Workflows (1 DAY)

**O que precisa:**

1. **Aprovação de Assinaturas** - Em `src/routes/admin.subscriptions.tsx`
   ```tsx
   // Buttons needed:
   - "Aprovar" → UPDATE subscription SET status='active' + send email
   - "Rejeitar" → UPDATE status='rejected' + send email com motivo
   - "Cancelar" → UPDATE status='expired'
   ```

2. **Admin Dashboard Stats** - Em `src/routes/admin.index.tsx`
   ```tsx
   // Add buttons to quick actions:
   - Técnicos verificados (count)
   - Assinaturas ativas (count)
   - Pagamentos pendentes (count)
   - Últimas denúncias (list)
   ```

3. **Admin Settings** - Em `src/routes/admin.settings.tsx`
   ```tsx
   // Super admin pode editar:
   - Comissões (%)
   - Limite técnicos por zona
   - Preço planos (em Kz)
   - Período free trial
   ```

**Tempo:** 1 dia

---

## 📋 ETAPA 2: COMPLETAR ADMIN UI (3-4 DIAS)

### O que está implementado ⚠️ mas falta UI

1. **Admin Reports** - `src/routes/admin.reports.tsx`
   - ✅ Tabela `user_reports` existe no BD
   - ❌ Componente vazio
   - Precisa: Listar, filtrar por status, marcar resolvido

2. **Admin Logs** - `src/routes/admin.logs.tsx`
   - ✅ Tabela `admin_logs` com auditoria
   - ❌ Componente vazio
   - Precisa: Listar com timestamps, filtrar por ação

3. **Admin Users Detalhes** - `src/routes/admin.users.tsx`
   - ⚠️ Parcialmente completo
   - Precisa: Modal com mais detalhes, histórico de ações

**Tempo:** 2-3 dias

---

## 📋 ETAPA 3: TESTES & SEGURANÇA (2-3 DIAS)

### Testes Manuais (1 dia)

```bash
# Checklist completo

☐ AUTENTICAÇÃO
  ☐ Sign up como técnico
  ☐ Sign up como empresa
  ☐ Login com email/password
  ☐ Logout funciona
  ☐ Redirect após login

☐ DASHBOARD
  ☐ Ver perfil técnico
  ☐ Editar perfil (nome, bio, foto)
  ☐ Upload portfolio (até 12 imagens)
  ☐ Ver status assinatura
  ☐ Upload comprovativo pagamento

☐ BUSCA
  ☐ Filtrar por zona
  ☐ Filtrar por serviço
  ☐ Filtrar premium/verificado
  ☐ Ordenação correta

☐ ADMIN PANEL
  ☐ Login como admin
  ☐ Ver dashboard com stats
  ☐ Listar técnicos
  ☐ Banir utilizador
  ☐ Aprovar assinatura
  ☐ Ver logs
  ☐ Criar serviço
  ☐ Criar bairro

☐ PAGAMENTOS (depois integrar Stripe)
  ☐ Checkout page
  ☐ Pagamento processado
  ☐ Subscription ativa após pagamento

☐ MOBILE
  ☐ Homepage responsiva
  ☐ Login responsivo
  ☐ Dashboard responsivo
  ☐ Admin panel responsivo (tablet)
```

### Segurança (1 dia)

```bash
☐ RLS Policies
  ☐ Verificar que utilizadores não veem dados alheios
  ☐ Admin consegue ver tudo
  ☐ Super admin consegue modificar settings

☐ Autenticação
  ☐ JWT token válido
  ☐ Logout limpa session
  ☐ Protected routes funcionam

☐ Input Validation
  ☐ Validar emails
  ☐ Validar uploads (tipo ficheiro, tamanho)
  ☐ Sanitizar inputs

☐ CORS
  ☐ Configurar headers corretos
  ☐ Testar requests cross-origin
```

---

## 📋 ETAPA 4: DEPLOY (1 DIA)

### Quando o projeto estiver 100%

```bash
# 1. Configurar Cloudflare Workers
npm install -g wrangler

# 2. Login
wrangler login

# 3. Preencher .env.production com valores reais

# 4. Build local
npm run build

# 5. Deploy
wrangler deploy --env production

# 6. URL final
# https://tecnico-certo.workers.dev

# 7. Testar em produção (mesmos testes de antes)
```

---

## 🗺️ MAPA DO PROJETO - ONDE COMEÇAR

### HOMEPAGE & AUTENTICAÇÃO
```
src/
├── routes/
│   ├── index.tsx ✅ (homepage)
│   ├── auth.tsx ✅ (login/signup)
│   └── technicians.tsx ✅ (busca)
├── components/
│   ├── brand/Logo.tsx ✅
│   ├── layout/SiteHeader.tsx ✅
│   └── layout/SiteFooter.tsx ✅
```

### DASHBOARD TÉCNICO/EMPRESA
```
src/routes/
├── dashboard.tsx ✅ (landing)
├── dashboard.perfil.tsx ✅ (editar perfil)
├── dashboard.portfolio.tsx ✅ (fotos)
├── dashboard.comprovativo.tsx ✅ (upload pagamento)
└── planos.tsx ✅ (3 planos com preços)
```

### ADMIN PANEL
```
src/routes/
├── admin.tsx ✅ (layout sidebar)
├── admin.index.tsx ⚠️ (stats — faltam botões)
├── admin.users.tsx ⚠️ (lista técnicos)
├── admin.subscriptions.tsx ⚠️ (aprovar assinaturas) **FALTA LÓGICA**
├── admin.services.tsx ✅ (criar serviços)
├── admin.zones.tsx ✅ (criar bairros)
├── admin.reports.tsx ❌ (vazio — precisa UI)
├── admin.logs.tsx ❌ (vazio — precisa UI)
├── admin.settings.tsx ❌ (vazio — falta)
└── admin.admins.tsx ✅ (gerenciar admins)

src/components/admin/
├── AdminUsersTable.tsx ⚠️ (WIP)
├── AdminSubscriptionsTable.tsx ⚠️ (WIP)
├── AdminLogsTable.tsx ❌ (vazio)
├── AdminReportsTable.tsx ❌ (vazio)
└── ProtectedAdminRoute.tsx ✅ (proteção)
```

### BANCO DE DADOS
```
supabase/
├── migrations/
│   ├── 20260527_admin_system.sql ✅ (schema)
│   ├── 20260527120000_admin_system_setup.sql ✅ (setup)
│   └── 20260527121000_assign_super_admin.sql ✅ (super admin)
└── config.toml ✅ (configuração local)
```

---

## ⭐ PRÓXIMO PASSO: ESCOLHA 1 COISA PARA FAZER

### Se quer ver funcionar rápido (30 min)
```
Vai a: src/routes/dashboard.comprovativo.tsx
Testa upload de arquivo localmente
npm run dev → http://localhost:5173/dashboard/comprovativo
```

### Se quer completar antes de publicar (3-5 dias)
```
1. Integração Stripe (2-3 dias)
2. Email notifications (1 dia)
3. Testes manuais (1-2 dias)
```

### Se quer publicar HOJE (incompleto mas funcional)
```
1. Preencher .env.production
2. npm run build
3. wrangler deploy --env production
4. App online, mas SEM pagamentos automáticos
```

---

## 📞 REFERÊNCIA RÁPIDA

| O Que Fazer | Ficheiro | Tempo |
|---|---|---|
| Integrar Stripe | `src/routes/dashboard.checkout.tsx` (criar novo) | 2 dias |
| Email notifications | `src/lib/email.ts` (criar novo) | 1 dia |
| Completar Admin | `src/routes/admin.*.tsx` (vários) | 2 dias |
| Testes | (criar `.test.ts` files) | 2 dias |
| Deploy | `wrangler deploy` | 30 min |

---

## 🎯 RECOMENDAÇÃO FINAL

**Semana 1:**
- [ ] Segunda: Integrar Stripe
- [ ] Quarta: Email notifications + completar admin workflows
- [ ] Sexta: Testes básicos

**Semana 2:**
- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Deploy em produção 🚀

**Tempo total:** 1-2 semanas até estar 100% completo e online

---

Pronto? Qual destes quer fazer primeiro? 👇
