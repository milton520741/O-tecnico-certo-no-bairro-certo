# 🚀 Guia Passo a Passo - Setup do Admin System

## 📋 Resumo

Você precisa fazer **3 coisas**:

1. ✅ Aplicar a migration no Supabase (criar tabelas)
2. ✅ Registar o Super Admin (Miltonfernandoalfredo@gmail.com)
3. ✅ Executar o script de setup

---

## 🔧 Passo 1: Aplicar a Migration

### Opção A: Via CLI (Mais Fácil)

```bash
# 1. Instale CLI (se não tiver)
npm install -g supabase

# 2. Faça login
supabase login

# 3. Link seu projeto
supabase link --project-ref seu-project-id

# 4. Aplique a migration
supabase db push

# ✅ Pronto!
```

### Opção B: Via Dashboard do Supabase (Web)

1. Acesse: **https://app.supabase.com**
2. Faça login
3. Selecione seu projeto
4. Vá a **SQL Editor** (lado esquerdo)
5. Clique **New Query**
6. **Abra o arquivo**: `supabase/migrations/20260527_admin_system.sql`
7. **Copie TODO o conteúdo**
8. **Cole no SQL Editor** do Supabase
9. Clique no botão ▶️ (Run)
10. Espere até ver: ✅ "Query executed successfully"

---

## 👤 Passo 2: Registar o Super Admin

1. Acesse a aplicação: **https://seu-dominio**
2. Clique em **Criar Conta** ou **Registar**
3. Preencha:
   - **Email**: `Miltonfernandoalfredo@gmail.com`
   - **Senha**: (escolha uma forte)
   - **Tipo**: Técnico (ou qualquer um)
4. Complete o registo
5. Verifique o email se necessário

✅ Agora o utilizador está criado no Supabase Auth

---

## ⚙️ Passo 3: Executar o Setup Script

### Via Node.js (Recomendado)

```bash
# Navegue até a pasta do projeto
cd seu-projeto

# Execute o script simples
node setup-admin-simple.js

# Ou se preferir TypeScript:
npx ts-node setup-admin.js
```

### O que o script faz:

1. Pede sua **Supabase URL**
2. Pede sua **Service Role Key**
3. Pede o **email do Super Admin**
4. Conecta ao Supabase
5. Encontra o utilizador registado
6. Adiciona permissões de Admin
7. Adiciona permissão de Super Admin
8. Verifica se tudo funcionou

---

## 📍 Onde Encontrar as Credenciais

### Supabase URL e Keys

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto
3. Vá a **Settings** (engrenagem, canto superior direito)
4. Vá a **API**
5. Você verá:
   - **Project URL** ← copie isto
   - **anon key** (não precisa)
   - **service_role key** ← copie isto (escondido)

### ⚠️ IMPORTANTE: Service Role Key

- **Nunca compartilhe** esta chave em público
- **Nunca publique** em GitHub
- **Apenas use** em scripts locais ou no servidor

---

## 🎯 Exemplo Completo

```bash
# 1. Terminal abre o script
$ node setup-admin-simple.js

# 2. Script pergunta:
🔗 URL do Supabase: https://abcdefgh.supabase.co
🔑 Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
📧 Email do Super Admin: Miltonfernandoalfredo@gmail.com

# 3. Script processa:
✅ Conexão OK!
✅ Utilizador encontrado!
✅ Role de Admin adicionado
✅ Permissão de Super Admin adicionada

# 4. Resultado:
🎉 SUCESSO!
📧 Email: Miltonfernandoalfredo@gmail.com
🔑 ID: 550e8400-e29b-41d4-a716-446655440000

# ✅ Pronto para usar!
```

---

## ✅ Verificar se Funcionou

### No Dashboard do Supabase

1. Vá a **SQL Editor**
2. Execute:
```sql
SELECT 
  u.email,
  ur.role,
  sa.id as super_admin_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.super_admins sa ON u.id = sa.user_id
WHERE u.email = 'Miltonfernandoalfredo@gmail.com';
```

Você deve ver:
```
email                           | role  | super_admin_id
Miltonfernandoalfredo@gmail.com | admin | 1
```

### Na Aplicação

1. Faça login com: `Miltonfernandoalfredo@gmail.com`
2. Acesse: `https://seu-dominio/admin`
3. Você deve ver o painel administrativo
4. Clique no menu e explore as opções

---

## 🚨 Troubleshooting

### "Utilizador não encontrado"

❌ **Problema**: O email não está registado

✅ **Solução**:
1. Vá na aplicação
2. Registre-se com `Miltonfernandoalfredo@gmail.com`
3. Execute o script novamente

---

### "Conexão falhou"

❌ **Problema**: Credenciais incorretas

✅ **Solução**:
1. Copie novamente as credenciais do Supabase
2. Certifique-se que **copiou a Service Role Key** (não a anon key)
3. Verifique se há espaços em branco extras

---

### "Tabelas não encontradas"

❌ **Problema**: A migration não foi aplicada

✅ **Solução**:
1. Volte ao **Passo 1: Aplicar Migration**
2. Use o SQL Editor do Supabase
3. Execute o arquivo `20260527_admin_system.sql`

---

### "Erro de RLS"

❌ **Problema**: Políticas de segurança não ativadas

✅ **Solução**:
- A migration cria automaticamente
- Se ainda tiver problemas, vá a **SQL Editor** e reexecute a migration

---

## 📞 Ajuda Rápida

### Se precisar de suporte:

1. **Verifique**: ADMIN_SYSTEM.md (documentação completa)
2. **Logs**: Veja os erros no terminal do script
3. **Dashboard**: Vá a Supabase → Logs → Realtime para ver o que aconteceu

---

## 🎉 Depois que Funcionar

### Acessar o Admin:

```
https://seu-dominio/admin
```

### Funcionalidades:

- Dashboard com estatísticas
- Gestão de utilizadores
- Aprovar assinaturas
- Criar serviços e bairros
- Ver histórico de ações
- Configurar sistema
- Gerenciar outros admins

---

## 📚 Documentação Completa

Veja **ADMIN_SYSTEM.md** para:
- Como usar cada funcionalidade
- Estrutura de permissões
- Como adicionar novos admins
- Troubleshooting avançado

---

**✅ Tudo pronto! Comece pelo Passo 1 acima.**
