# 🚀 DEPLOY — Cloudflare Workers.dev

## ⚡ QUICK DEPLOY (30 MINUTOS)

### Prerequisitos
- [ ] Node.js 18+ instalado
- [ ] Conta Cloudflare (grátis)
- [ ] .env.production preenchido

### 3 Comandos

```bash
# 1. Login Cloudflare
wrangler login

# 2. Build
npm run build

# 3. Deploy
wrangler deploy --env production
```

**PRONTO!** 🎉 URL: `https://tecnico-certo.workers.dev`

---

## 📋 SETUP DETALHADO

### Passo 1: Instalar Wrangler (5 min)

```bash
npm install -g wrangler
# ou
npm install --save-dev wrangler
```

Verificar:
```bash
wrangler --version
```

### Passo 2: Criar Conta Cloudflare (5 min)

1. Va a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Sign up** (grátis)
3. Verifica email

### Passo 3: Login Local (5 min)

```bash
wrangler login
```

- Abre navegador automaticamente
- Clica **Authorize Wrangler**
- Volta ao terminal (token guardado)

### Passo 4: Configurar .env.production (5 min)

```bash
# Abra ficheiro: .env.production

VITE_SUPABASE_URL=https://seu-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...

# Adicionar ao .env.production (não no .env.example):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5c... # optional mas recomendado
```

**Como obter as keys:**
1. Va a [app.supabase.com](https://app.supabase.com)
2. Seleciona seu projeto
3. **Settings** (⚙️) → **API**
4. **Project URL** = VITE_SUPABASE_URL
5. **anon key** = VITE_SUPABASE_ANON_KEY
6. **service_role key** = SUPABASE_SERVICE_ROLE_KEY (scroll down)

### Passo 5: Build Local (5 min)

```bash
npm run build
```

Espera output:
```
✓ Build complete in XXXms

dist/
├── client/
├── server/
└── index.js
```

Se der erro:
```bash
# Limpar cache
rm -rf dist node_modules
npm install
npm run build
```

### Passo 6: Deploy (5 min)

```bash
wrangler deploy --env production
```

Output esperado:
```
 ✓ Uploaded tecnico-certo-prod
 ✓ Deployment complete! 
   https://tecnico-certo.workers.dev
```

### Passo 7: Testar (5 min)

1. Abre [https://tecnico-certo.workers.dev](https://tecnico-certo.workers.dev)
2. Testa:
   - [ ] Homepage carrega
   - [ ] Login funciona
   - [ ] Dados do Supabase aparecem

---

## 🔧 TROUBLESHOOTING

### ❌ "Failed to publish your Function"
```
Solução: Verifica se VITE_* environment variables estão no .env.production
```

### ❌ "VITE_SUPABASE_URL is undefined"
```
Solução: Recarregar página, variáveis podem demorar 1-2 min a ativar
```

### ❌ "Build failed"
```bash
# Limpar e tentar de novo
rm -rf dist .wrangler
npm run build
```

### ❌ "Not authenticated. Please run `wrangler login`"
```bash
wrangler logout
wrangler login
# Autoriza novamente
```

### ❌ "Cannot find module '@tanstack/react-start'"
```bash
npm install
npm run build
```

---

## 🔄 DEPLOY CONTÍNUO (CI/CD)

### Opção 1: Manual (Recomendado enquanto desenvolvendo)
```bash
# Sempre que terminas feature
git commit -m "feat: nova feature"
git push origin main
npm run build
wrangler deploy --env production
```

### Opção 2: Automático com GitHub Actions (Depois)

Criar `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm run build
      
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 📊 MONITORING & LOGS

### Ver Logs Cloudflare

```bash
# Real-time logs
wrangler tail --env production

# Histórico
wrangler deployments list --env production
```

### Dashboard Cloudflare

1. Va a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Menu esquerdo → **Workers** → **tecnico-certo-prod**
3. Ver:
   - ✅ Requests (total, sucesso/erro)
   - ✅ Performance
   - ✅ Erros

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Onde guardá-las?

**Local (.env.production):**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Em Produção (Cloudflare Secrets):**

Opção A: Via CLI
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Cola a chave e Enter
```

Opção B: Via Dashboard
1. Dashboard → Workers → tecnico-certo-prod
2. **Settings** → **Variables**
3. Add: `SUPABASE_SERVICE_ROLE_KEY`

---

## 📈 PRÓXIMAS ETAPAS

### Após primeiro deploy
- [ ] Testar login/busca/admin em produção
- [ ] Configurar Google Analytics
- [ ] Configurar Sentry (error tracking)
- [ ] Setup backups automáticos (Supabase)

### Domínio customizado (Depois)
```
Se quiseres mudar de tecnico-certo.workers.dev para seu-dominio.com:
1. Registar domínio
2. Apontar DNS para Cloudflare
3. Adicionar rota em wrangler.jsonc
```

---

## 🎯 URLS IMPORTANTES

| Recurso | URL |
|---------|-----|
| **App em Produção** | https://tecnico-certo.workers.dev |
| **Admin Panel** | https://tecnico-certo.workers.dev/admin |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |
| **Supabase Project** | https://app.supabase.com |

---

## ✅ CHECKLIST PRÉ-DEPLOY

```bash
☐ npm run build - zero erros
☐ .env.production preenchido
☐ VITE_SUPABASE_URL válido
☐ VITE_SUPABASE_ANON_KEY válido
☐ wrangler login - authenticated
☐ wrangler deploy --env production - deployed
☐ Homepage carrega em https://tecnico-certo.workers.dev
☐ Login funciona
☐ Dados aparecem (técnicos, serviços, etc.)
☐ Admin panel acessível (se logged como admin)
```

---

## 🎉 PARABÉNS!

App online em `tecnico-certo.workers.dev` 🚀

Próximo: Completar features de pagamentos e notificações antes de ir a "production ready"
