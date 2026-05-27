# 📋 Checklist de Publicação - EvoluinF

**Status Global:** 🟡 **70% Pronto** | **6 semanas até MVP**

---

## 🎯 ESSENCIAL (BLOCKER)

### 1. ✅ **Banco de Dados**
- ✅ Schema completo (users, technicians, companies, subscriptions, payments)
- ✅ RLS policies implementadas
- ✅ Functions (ban_user, verify_user, is_admin)
- ✅ Admin system (logs, reports, super_admins)
- **Status:** PRONTO

### 2. ✅ **Autenticação & Autorização**
- ✅ Login/signup com Supabase Auth
- ✅ Role-based access control (technician, company, admin)
- ✅ Protected routes
- ✅ Super admin system
- **Status:** PRONTO

### 3. ✅ **UI Components**
- ✅ shadcn/ui completo (30+ componentes)
- ✅ Responsive design
- ✅ Admin panel estruturado
- **Status:** PRONTO

### 4. ✅ **Funcionalidades Core**
- ✅ Homepage com busca
- ✅ Perfil de técnico/empresa
- ✅ Dashboard
- ✅ Sistema de assinaturas (Simples, Premium, Empresa)
- ✅ Upload de comprovativo de pagamento
- ✅ Gestão de portfólio
- ✅ Painel admin completo
- **Status:** PRONTO (90%)

### 5. ⚠️ **Deploy Infrastructure**
- ✅ Vite + TanStack Start configurado
- ✅ Cloudflare Workers pronto
- ⚠️ **FALTA:** Domínio configurado
- ⚠️ **FALTA:** SSL/HTTPS
- ⚠️ **FALTA:** CI/CD pipeline (GitHub Actions)
- **Status:** 50% | **PRIORIDADE ALTA**

### 6. ⚠️ **Produção Ready**
- ⚠️ **FALTA:** Variáveis de ambiente (.env)
- ⚠️ **FALTA:** Error tracking (Sentry)
- ⚠️ **FALTA:** Analytics (Google Analytics)
- ⚠️ **FALTA:** Monitoring/alerting
- **Status:** 20% | **PRIORIDADE ALTA**

---

## 🚨 CRÍTICO (Próximas 2 semanas)

### A. **Configuração de Produção**

```bash
# Checklist:
☐ Registar domínio (.ao ou .pt)
☐ Configurar DNS para Cloudflare
☐ SSL certificate automático (Cloudflare FREE)
☐ .env.production com valores reais
☐ Testar build: npm run build
☐ Testar preview local: npm run preview
```

**Arquivos críticos:**
- `.env` - Variáveis de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- `wrangler.jsonc` - Configuração Cloudflare
- `vite.config.ts` - Build configuration

### B. **Testes & QA**

```bash
# O que testar:
☐ Login/signup como técnico
☐ Login/signup como empresa
☐ Fluxo de assinatura (7 dias grátis → pagamento)
☐ Upload de comprovativo
☐ Admin panel (users, subscriptions, logs)
☐ Busca de técnicos por bairro
☐ Responsividade mobile
☐ Performance (Lighthouse)
```

### C. **Segurança**

```bash
☐ Verificar RLS policies (Supabase)
☐ Validar permissões admin
☐ Testar SQL injection
☐ Verificar rate limiting
☐ Confirmar dados sensíveis não expostos
```

**Verificações rápidas:**
```sql
-- Supabase SQL Editor
SELECT * FROM auth.users; -- Deve falhar (RLS)
SELECT * FROM admin_logs; -- Deve ter RLS
SELECT * FROM super_admins; -- Verificar
```

---

## ⭐ IMPORTANTE (Próximas 3 semanas)

### 1. **Otimizações & Performance**

```bash
☐ Lazy load componentes (React.lazy)
☐ Image optimization (next-image ou similar)
☐ Code splitting
☐ Minification
☐ Cache strategy (headers)
☐ CDN para assets estáticos
```

**Verificar:**
```bash
npm run build
# Deve dar < 100KB bundle size
```

### 2. **Funcionalidades Missing**

```
☐ Reset password (forgot password flow)
☐ Verificação de email
☐ 2FA para admin
☐ Export de dados (admin)
☐ Backup automático (Supabase configurar)
☐ Terms of service página
☐ Privacy policy página
☐ GDPR compliance
```

### 3. **Sistema de Notificações**

```
☐ Email de confirmaçãõ (Sign-up)
☐ Email de assinatura aprovada
☐ Email de pagamento recebido
☐ Notificações in-app (toast)
☐ WhatsApp API (opcional mas importante)
```

### 4. **Monitoramento**

```
☐ Sentry (error tracking)
☐ Google Analytics
☐ Uptime monitoring
☐ Database backups
☐ Logs centralizados
```

---

## 📋 ROADMAP POR FASE

### **FASE 1: MVP Deploy (2 semanas)**
**Objetivo:** Colocar online com features essenciais

```
Semana 1:
  ☐ Domínio + DNS + SSL
  ☐ Deploy test em staging
  ☐ Testes core flow (auth, search, subscription)
  ☐ Fix bugs críticos

Semana 2:
  ☐ Testes admin panel
  ☐ Performance tweaks
  ☐ Security review
  ☐ LAUNCH 🚀
```

**Deployar com:**
- Autenticação ✅
- Busca de técnicos ✅
- Sistema de assinaturas ✅
- Painel admin básico ✅

**NÃO precisa na launch:**
- Reset password (depois)
- Analytics avançado (depois)
- Notificações por email (WhatsApp já existe)

---

### **FASE 2: Estabilidade (Semanas 3-4)**

```
☐ Monitoring & alerting
☐ Backup strategy
☐ Performance optimization
☐ Bug fixes baseado em user feedback
☐ Documentação de suporte
```

---

### **FASE 3: Funcionalidades Extra (Semanas 5-6)**

```
☐ Chat entre técnico e cliente
☐ Sistema de ratings
☐ Push notifications
☐ Mobile app (React Native)
☐ API pública
```

---

## ✅ VERIFICAÇÃO PRÉ-LAUNCH

### **24 Horas Antes**

```
SECURITY
☐ npm audit (sem vulnerabilidades críticas)
☐ Supabase RLS recheck
☐ Environment variables corretas
☐ Secrets não em código

FUNCTIONALITY
☐ Login funciona
☐ Busca funciona
☐ Assinatura completa (7 dias → pagamento)
☐ Admin pode banir user
☐ Admin pode aprovar assinatura

PERFORMANCE
☐ Homepage carrega < 3s
☐ Lighthouse score > 90
☐ Database queries < 100ms
☐ Mobile responsive

MONITORING
☐ Sentry configurado
☐ Error tracking funciona
☐ Analytics funciona
☐ Alerts configurados
```

---

## 🚀 DEPLOYMENT (Para quando tudo estiver pronto)

### **Option 1: Cloudflare Workers (Recomendado)**

```bash
# 1. Fazer build
npm run build

# 2. Deploy
wrangler deploy

# 3. Verificar
curl https://seu-dominio.com
```

**Vantagens:**
- Free tier generoso
- Edge deployment (rápido)
- SSL automático
- Escalável

### **Option 2: Vercel (Alternativo)**

```bash
npm run build
vercel deploy --prod
```

---

## 📊 MÉTRICAS DE SUCESSO (1ª semana pós-launch)

```
✅ 0 downtime
✅ < 100ms latência média
✅ < 1% erro rate
✅ > 90 Lighthouse score
✅ < 3s homepage load time
✅ Auth working 100%
✅ Admin panel responsive
✅ 0 database errors
```

---

## 💰 CUSTO MENSAL ESTIMADO

```
Supabase (PostgreSQL 2GB)      $25
Cloudflare Workers (Pro)        $20
Domain                          $10
Sentry (Error tracking)         $0 (free)
Google Analytics               $0 (free)
─────────────────────────────────
TOTAL                          ~$55/mês

OBS: Primeiros 3 meses Cloudflare free (testando)
```

---

## 🎯 PRÓXIMOS PASSOS (TODO)

### **HOJE/AMANHÃ:**
1. [ ] Registar domínio
2. [ ] Setup Cloudflare
3. [ ] Configurar .env.production
4. [ ] Build local test

### **SEMANA 1:**
5. [ ] Deploy staging
6. [ ] Testes QA completos
7. [ ] Security review
8. [ ] Fix bugs

### **SEMANA 2:**
9. [ ] Performance optimization
10. [ ] Monitoring setup
11. [ ] LAUNCH

---

## 📞 CONTACTOS IMPORTANTES

**Super Admin:**
- Email: miltonfernandoalfredo@gmail.com
- WhatsApp: +244 947470500
- Role: Acesso total admin

**Tecnologias:**
- Hosting: Cloudflare Workers
- Database: Supabase PostgreSQL
- Frontend: React + TanStack
- Auth: Supabase Auth

---

## 📝 NOTAS FINAIS

> **O projeto está 70% pronto para produção.**
> 
> **Faltam apenas:** deploy infrastructure, domínio, SSL, e alguns testes.
> 
> **Tempo estimado para launch:** 2 semanas se tudo correr bem.
> 
> **Risco:** Baixo. Arquitetura é sólida, features core estão prontas.

---

**Última atualização:** 27 de Maio de 2026  
**Responsável:** Milton Fernando Alfredo  
**Status Geral:** 🟡 Pronto para Staging
