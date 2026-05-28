# 📊 Admin Dashboard - Guia de Uso

## 🎯 Objetivo
Gerenciar técnicos, empresas, assinaturas e pagamentos de forma manual (sem Stripe).

---

## 📍 Acesso

**URL:** `https://seu-site.com/admin`

**Permissões Necessárias:**
- `super_admin` - Acesso completo
- `admin` - Acesso a dashboard, subscriptions, payments, reports
- `moderator` - Acesso limitado (em desenvolvimento)

---

## 🏠 Dashboard Principal

### Stats Overview
Vê um resumo rápido de:
- **Técnicos:** Total + Verificados
- **Empresas:** Total + Verificadas  
- **Assinaturas:** Total + Ativas
- **Comprovantes:** Total + Pendentes

### Widgets de Ações Pendentes

**1️⃣ Assinaturas Pendentes**
- Mostra as últimas 5 assinaturas aguardando aprovação
- Clica no botão "Ver" para ir à página de subscriptions
- Clica em "Ver Todos" para ver todas as pendentes

**2️⃣ Comprovantes de Pagamento**
- Mostra os últimos comprovantes enviados
- Clica em "Ver Prova" para visualizar a imagem
- Clica em "Ver Todos" para ir à página de gestão

**3️⃣ Denúncias Pendentes**
- Lista denúncias de segurança/comportamento
- Mostra prioridade (LOW, NORMAL, HIGH, CRITICAL)
- Clica para investigar e resolver

---

## 💳 Novo Fluxo de Pagamento (Manual)

### Como um Técnico Paga a Assinatura?

1. Técnico realiza pagamento via **IBAN/Móvel Dinheiro/Vimbo**
2. Técnico tira **foto do comprovante**
3. Técnico faz **upload na dashboard**
4. Status muda para **"Pagamento Pendente"**

### Como Admin Aprova?

1. Vai a `/admin/payment-proofs` 
2. Vê lista de comprovantes pendentes
3. Clica **"Ver"** para visualizar a imagem
4. Verifica se está legível e valor correto
5. Clica **"✓ Aprovar"** para ativar a assinatura
6. Pode adicionar notas opcionais
7. ✅ Subscription fica **ATIVA** imediatamente

### Se Comprovante está Errado?

1. Clica **"✗ Rejeitar"**
2. Escreve o motivo (ex: "Imagem não legível")
3. Admin envia mensagem no WhatsApp para técnico
4. Técnico envia novo comprovante
5. Admin aprova o novo

---

## 📋 Páginas Admin Principais

### `/admin`
Dashboard geral com stats e ações urgentes

### `/admin/payment-proofs`
**Gestão de Comprovantes de Pagamento**
- Listar todos os comprovantes
- Visualizar imagens
- Aprovar com notas
- Rejeitar com motivo
- Auditoria de ações

### `/admin/subscriptions`
**Gestão de Assinaturas** 
- Listar assinaturas ativas, pendentes, rejeitadas
- Ver plano (Simples, Premium, Empresa)
- Ver datas (início, fim, criação)
- Filtrar por status
- Rejeitar com motivo

### `/admin/users`
**Gestão de Técnicos e Empresas**
- Verificar usuários (colocar badge de "Verificado")
- Banir usuários suspeitos
- Ver histórico de ações

### `/admin/reports`
**Denúncias de Segurança**
- Listar denúncias pendentes
- Investigar e resolver
- Registar resolução

### `/admin/logs`
**Auditoria de Ações**
- Ver todas as ações dos admins
- IP, timestamp, mudanças feitas
- Filtrar por ação, entidade, admin

---

## ⚡ Ações Rápidas

### Aprovar Pagamento
```
Dashboard → Comprovantes Pendentes → "✓ Aprovar"
Ou
/admin/payment-proofs → Selecionar comprovante → "✓ Aprovar"
```

### Rejeitar Pagamento  
```
Dashboard → Comprovantes Pendentes → "✗ Rejeitar"
Ou
/admin/payment-proofs → Selecionar comprovante → "✗ Rejeitar" → Escrever motivo
```

### Banir Técnico
```
/admin/users → Encontrar técnico → Clique 3 pontos → "Banir" → Motivo
```

### Verificar Técnico
```
/admin/users → Encontrar técnico → "Verificar" (aparece verificado com ✓)
```

---

## 📊 Statuses nos Comprovantes

| Status | Cor | Significado |
|--------|-----|------------|
| 🔄 Pendente | Amarela | Aguardando aprovação do admin |
| ✅ Aprovado | Verde | Assinatura está ativa |
| ❌ Rejeitado | Vermelha | Admin rejeitou, técnico pode reenviear |

---

## 🔐 Segurança

**Todas as ações são auditadas:**
- Quem aprovou/rejeitou
- Quando foi feito
- De que IP/dispositivo
- Mudanças realizadas

**Ver auditoria em:** `/admin/logs`

---

## 📱 Comunicação com Técnicos

Atualmente **sem SendGrid**:

### Admin recebe notificações:
- ✉️ **Email** (opcional)
- 💬 **WhatsApp manual** (você envia mensagem)

### Técnico recebe mensagens via:
- 💬 **WhatsApp** (número do perfil)
- ✉️ **Email** (automático quando possível)

### Fluxo de Rejeição Manual:
1. Admin clica "Rejeitar" com motivo
2. Admin copia a mensagem
3. Admin envia no WhatsApp do técnico
4. Técnico envia novo comprovante
5. Admin aprova

---

## 🚀 Dicas e Boas Práticas

✅ **Fazer:**
- Revisar comprovantes com cuidado
- Adicionar notas nas aprovações (ex: "Conforme conversa WhatsApp")
- Arquivar comunicações importantes
- Resolver denúncias rapidamente

❌ **Evitar:**
- Aprovar sem ver a imagem
- Esquecer-se de comunicar rejeição
- Deixar items pendentes por muito tempo
- Perder registro de ações

---

## ❓ Dúvidas Frequentes

**P: E se o técnico não enviar novo comprovante?**
R: Entra em contacto via WhatsApp. Se não responder em X dias, rejeita a subscription automaticamente.

**P: Como vejo o histórico de um técnico?**
R: Va a `/admin/users`, procura o técnico, clica nele para ver histórico completo.

**P: Posso aprovar múltiplos comprovantes ao mesmo tempo?**
R: Atualmente não, mas em desenvolvimento está a funcionalidade de ações em lote.

**P: Quanto tempo leva para ativar após aprovar?**
R: Instantaneamente! A subscription fica ativa assim que clicas "Aprovar".

---

## 📞 Suporte
Para problemas técnicos, contacta o desenvolvedor.
