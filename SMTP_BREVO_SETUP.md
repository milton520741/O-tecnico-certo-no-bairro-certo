# 🔧 Configurar SMTP Brevo no Supabase - Corrigir Erro de Email

## ❌ Problema Atual
**"Error sending confirmation email"** - Técnicos não conseguem se cadastrar

---

## ✅ Solução: Configurar Custom SMTP no Supabase

### **Passo 1: Acessa o Supabase Dashboard**
Vai para: https://supabase.com/dashboard/project/ohfsifdothuvbbpufako

### **Passo 2: Abre Authentication → Email Settings**
1. Clica em **"Authentication"** no menu esquerdo
2. Procura por **"Emails"** ou **"Settings"**
3. Procura a seção **"Custom SMTP"** ou **"Email Provider"**

### **Passo 3: Ativa Custom SMTP**
- Encontra a opção para usar SMTP personalizado
- Ativa/Enable essa opção

### **Passo 4: Preenche os Dados do Brevo**

```
SMTP Server: smtp-relay.brevo.com
SMTP Port: 587
SMTP Username: acd1eb001@smtp-brevo.com
SMTP Password: xsmtpsib-75699d9de4aed7eb74ae2963e494661b7ef827923d619e1d678d5ac479ccef85-0GR4HRzAMw3fBtWC
```

### **Passo 5: Configurações Opcionais**
- **From Email**: Use `evoluingroupoilandgas@gmail.com` (conforme constants.ts)
- **TLS**: Ativa/Enable
- **Autenticação**: SPA Encryption ou PLAIN (dependendo da interface)

### **Passo 6: Testa a Conexão**
- Supabase oferece um botão "Test Connection" ou similar
- Verifica se aparece mensagem de sucesso

### **Passo 7: Guarda as Configurações**
- Clica em **"Save"** ou **"Update"**

---

## 📋 Dados Necessários (Já tens!)

| Campo | Valor |
|-------|-------|
| **Host SMTP** | smtp-relay.brevo.com |
| **Porta** | 587 |
| **Usuário** | acd1eb001@smtp-brevo.com |
| **Chave/Senha** | xsmtpsib-75699d9de4aed7eb74ae2963e494661b7ef827923d619e1d678d5ac479ccef85-0GR4HRzAMw3fBtWC |
| **TLS/SSL** | Ativa (TLS na porta 587) |

---

## 🧪 Testa Depois de Configurar

Após configurar:

1. Vai para: https://tecnico-certo.miltonfernandoalfredo.workers.dev/auth?mode=signup
2. Tenta criar uma conta com um email teste
3. Verifica se recebe o email de confirmação
4. Se receber ✅ = Problema resolvido!

---

## 🆘 Se Ainda Não Funcionar

### Verificações:
- ✅ Chave SMTP está correta?
- ✅ Porta é 587 (não 25 ou 465)?
- ✅ TLS está ativado?
- ✅ Usuário é exatamente: `acd1eb001@smtp-brevo.com`?

### Documentação:
- **Supabase SMTP**: https://supabase.com/docs/guides/auth/auth-smtp
- **Brevo SMTP**: https://help.brevo.com/hc/en-us/articles/115000041738-Configure-SMTP

### Suporte:
- Contacta Supabase: https://supabase.com/support
- Contacta Brevo: support@brevo.com

---

## 📝 Notas
- O código da aplicação **está correto** ✅
- O problema é apenas na **configuração do SMTP do Supabase** 
- Depois de configurar, todos os usuários conseguirão receber emails de confirmação
- Os técnicos finalmente conseguirão se cadastrar! 🎉
