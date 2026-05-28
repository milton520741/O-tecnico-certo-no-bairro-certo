# 🚀 Guia Deploy - Cloudflare Pages (Grátis)

## 📋 Resumo
- **Domínio:** `tecnico-certo.pages.dev` (grátis)
- **Tempo:** 30 minutos
- **Custo:** $0

---

## ✅ PRÉ-REQUISITOS

- [ ] Conta GitHub (já tem)
- [ ] Repo clonado: `O-tecnico-certo-no-bairro-certo`
- [ ] Supabase project com dados preenchidos

---

## 🔧 PASSO 1: Atualizar Variáveis de Ambiente

### 1.1 Preencher `.env.production`

```bash
# Abra o ficheiro: .env.production
VITE_SUPABASE_URL=https://seu-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...seu-key...
```

**Como obter as keys:**
1. Va a [app.supabase.com](https://app.supabase.com)
2. Settings → API → Copy as needed
3. Copie `Project URL` e `Anon Key`

### 1.2 Fazer commit

```bash
git add .env.production public/_routes.json
git commit -m "chore: prepare for Cloudflare Pages deployment"
git push origin main
```

---

## 🌐 PASSO 2: Criar Conta Cloudflare (Se não tiver)

1. Vai a [cloudflare.com/pt-PT](https://cloudflare.com/pt-PT)
2. Clica **Sign up** (grátis)
3. Preenche email/password
4. Verifica email

---

## 📦 PASSO 3: Deploy via Cloudflare Pages

### 3.1 Conectar GitHub

1. Login em [dash.cloudflare.com](https://dash.cloudflare.com)
2. No menu esquerdo: **Pages** (ou va diretamente a pages.cloudflare.com)
3. Clica **Create a project** → **Connect to Git**

### 3.2 Selecionar Repo

1. Clica **GitHub** (ou GitLab)
2. Autoriza Cloudflare aceder ao GitHub
3. Escolhe repo: `O-tecnico-certo-no-bairro-certo`

### 3.3 Configurar Build

1. **Project name:** `tecnico-certo` (aparecerá como `tecnico-certo.pages.dev`)
2. **Production branch:** `main`
3. **Framework:** Vite (ou deixar em branco)
4. **Build command:** `npm run build`
5. **Build output directory:** `dist`

### 3.4 Adicionar Variáveis de Ambiente

1. Clica **Environment variables**
2. Adiciona:

```
VITE_SUPABASE_URL = https://seu-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbG...seu-key...
```

3. Clica **Save and Deploy**

---

## ⏳ PASSO 4: Esperar Deploy

1. Cloudflare começa a build
2. Espera 3-5 minutos
3. Ve status em **Deployments** → mostrar verde ✅

---

## ✅ PASSO 5: Testar

1. Acede: `https://tecnico-certo.pages.dev`
2. Testa:
   - [ ] Homepage carrega
   - [ ] Login funciona
   - [ ] Busca de técnicos funciona
   - [ ] Admin panel acessível
   - [ ] Mobile responsivo

---

## 🎯 DEPLOY AUTOMÁTICO FUTURO

Agora cada vez que fazes `git push origin main`:

1. GitHub webhook notifica Cloudflare
2. Cloudflare faz build automático
3. Deploy em 3-5 minutos

**Sem fazer nada manualmente!** ✨

---

## 🚨 TROUBLESHOOTING

### Erro: "Build failed"
```bash
# Testa localmente
npm run build
npm run preview
```

### Erro: "Cannot find module"
```bash
# Reinstala dependências
rm -rf node_modules
npm install
npm run build
```

### Erro: "VITE_SUPABASE_URL is undefined"
- Verifica se adicionou variáveis no Cloudflare Pages
- Pode demorar 1 min para ativar

---

## 📊 INFORMAÇÕES ÚTEIS

### URLs Importantes

| Recurso | URL |
|---------|-----|
| **App (Production)** | https://tecnico-certo.pages.dev |
| **Dashboard** | https://tecnico-certo.pages.dev/admin |
| **Supabase** | https://app.supabase.com |
| **Cloudflare Pages** | https://dash.cloudflare.com/?to=/:account/pages/view |

### Monitoring

- **Build logs:** Cloudflare Dashboard → Pages → Deployments → ver logs
- **Performance:** Lighthouse (vai abrir automático)
- **Erros:** Browser console (F12)

---

## 💡 PRÓXIMOS PASSOS (Depois)

- [ ] Adicionar domínio próprio (se quiser)
- [ ] Configurar analytics (Google Analytics)
- [ ] Configurar error tracking (Sentry)
- [ ] SSL/HTTPS (automático no Pages)
- [ ] CDN para imagens (Cloudflare Image Optimization)

---

## 🎉 **DONE!**

Parabéns! A aplicação está online em `tecnico-certo.pages.dev` 🚀
