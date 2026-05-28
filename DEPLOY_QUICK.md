# ⚡ DEPLOY RÁPIDO - 3 PASSOS (15 min)

## 1️⃣ Guardar Variáveis (2 min)

Abre `.env.production` e preenche:

```
VITE_SUPABASE_URL=https://seu-project.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key
```

Depois:
```bash
git add .env.production public/_routes.json
git commit -m "deploy: prepare cloudflare"
git push origin main
```

---

## 2️⃣ Criar Cloudflare Account (3 min)

1. Va a [cloudflare.com](https://cloudflare.com)
2. **Sign up** → preench email/password
3. Verifica email

---

## 3️⃣ Deploy no Pages (10 min)

1. Login em [dash.cloudflare.com](https://dash.cloudflare.com)
2. Menu esquerdo → **Pages**
3. **Create a project** → **Connect to Git** → **GitHub**
4. Seleciona: `O-tecnico-certo-no-bairro-certo`
5. **Project name:** `tecnico-certo`
6. **Build command:** `npm run build`
7. **Build output:** `dist`
8. **Environment variables:**
   - `VITE_SUPABASE_URL` = seu-url
   - `VITE_SUPABASE_ANON_KEY` = seu-key
9. **Save and Deploy** ✅

---

## 🎉 PRONTO!

Em 3-5 minutos:

📱 `https://tecnico-certo.pages.dev`

---

## 📝 Documentação Completa

Vê [CLOUDFLARE_PAGES_DEPLOY.md](./CLOUDFLARE_PAGES_DEPLOY.md) para detalhes.
