# 🎯 Quick Start - Admin Setup

## Tl;dr - 3 Passos

### 1️⃣ Aplicar Migration (5 min)

**Via Supabase Dashboard:**

```
1. Vá a https://app.supabase.com
2. SQL Editor → New Query
3. Copie o arquivo: supabase/migrations/20260527_admin_system.sql
4. Cole tudo no editor
5. Clique no botão ▶️ (Run)
```

**Via CLI:**

```bash
supabase link --project-ref seu-id
supabase db push
```

### 2️⃣ Registar Super Admin (2 min)

Na aplicação:
- Email: `Miltonfernandoalfredo@gmail.com`
- Password: (escolha uma)
- Complete o registo

### 3️⃣ Executar Setup Script (1 min)

```bash
node setup-admin-simple.js
```

Responda:
- URL do Supabase
- Service Role Key
- Email do Super Admin

✅ **PRONTO!**

---

## Onde Encontrar as Keys

**Supabase Dashboard:**

1. Settings (⚙️)
2. API
3. Copie:
   - Project URL
   - service_role key (esquerda no scroll)

---

## Depois que Terminar

Acesse:
```
https://seu-dominio/admin
```

Login com:
- Email: `Miltonfernandoalfredo@gmail.com`
- Password: (que criou)

✅ Parabéns! Sistema admin funcionando!

---

## Documentação

- **Completa**: ADMIN_SYSTEM.md
- **Passo a Passo**: SETUP_INSTRUCTIONS.md

---

**Dúvidas? Veja SETUP_INSTRUCTIONS.md (Troubleshooting)**
