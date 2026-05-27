# Sistema Administrativo - Guia Completo

## 📋 Visão Geral

O sistema administrativo foi implementado com um painel completo para gerenciar:
- ✅ Utilizadores (técnicos e empresas)
- ✅ Assinaturas e aprovações
- ✅ Serviços e categorias
- ✅ Bairros/Zonas de Luanda
- ✅ Denúncias de utilizadores
- ✅ Histórico de ações (logs)
- ✅ Configurações globais
- ✅ Gestão de admins e super admins

## 🔐 Sistema de Permissões (RBAC)

### Níveis de Acesso

1. **Super Admin** (Máximo)
   - Acesso total a todas as funcionalidades
   - Pode gerenciar outros admins
   - Pode modificar configurações globais
   - Pode ver todos os logs

2. **Admin** (Padrão)
   - Gerenciar utilizadores (banir, verificar)
   - Aprovar/rejeitar assinaturas
   - Gerenciar serviços, categorias e bairros
   - Ver relatórios de denúncias
   - Ver logs de ações

3. **Utilizador** (Normal)
   - Sem acesso ao painel admin

## 🚀 Como Usar

### 1. Acessar o Painel Admin

```
https://seu-dominio/admin
```

Você será automaticamente redirecionado se não tiver permissões.

### 2. Configurar Super Admin Inicial

Existem duas formas:

#### Opção A: Via SQL (Recomendado para primeira vez)

1. Abra `supabase/setup-super-admin.sql`
2. O utilizador `Miltonfernandoalfredo@gmail.com` deve se registar primeiro via aplicação
3. Na dashboard do Supabase:
   - Vá a `SQL Editor`
   - Execute:
   ```sql
   -- Obter o user_id
   SELECT id FROM auth.users WHERE email = 'Miltonfernandoalfredo@gmail.com';
   ```
   - Copie o ID retornado

4. Execute o seguinte (substitua <USER_ID> com o ID copiado):
   ```sql
   -- Adicionar como admin
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('<USER_ID>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;

   -- Adicionar como super admin
   INSERT INTO public.super_admins (user_id)
   VALUES ('<USER_ID>')
   ON CONFLICT (user_id) DO NOTHING;
   ```

#### Opção B: Via Formulário no Painel Admin

Se já tiver um super admin:
1. Acesse `/admin/admins`
2. Clique em "+ Adicionar Admin"
3. Insira o email do novo admin
4. Marque "Tornar Super Admin" se desejado
5. Clique "Adicionar"

### 3. Estrutura das Rotas Admin

```
/admin                    - Dashboard principal
/admin/users              - Gestão de utilizadores
/admin/subscriptions      - Gestão de assinaturas
/admin/services           - Gestão de serviços e categorias
/admin/zones              - Gestão de bairros
/admin/reports            - Visualizar denúncias
/admin/logs               - Histórico de ações
/admin/settings           - Configurações (Super Admin)
/admin/admins             - Gestão de admins (Super Admin)
```

## 🎨 Funcionalidades Principais

### Gestão de Utilizadores
- Visualizar lista de técnicos e empresas
- Verificar utilizadores (aprovar perfil)
- Banir/Desbloquear utilizadores
- Ver informações de contacto
- Histórico de ações

### Gestão de Assinaturas
- Ver todas as assinaturas
- Filtrar por status (pendente, ativa, expirada, rejeitada)
- Aprovar assinaturas com comprovativo
- Rejeitar assinaturas
- Ver estatísticas

### Gestão de Serviços
- Criar novos serviços
- Criar categorias de serviços
- Ativar/desativar categorias
- Deletar serviços

### Gestão de Bairros
- Criar novos bairros em Luanda
- Ver lista de bairros cadastrados
- Deletar bairros

### Relatórios
- Ver denúncias de utilizadores
- Filtrar por prioridade
- Visualizar status (pendente, em investigação, resolvido)

### Logs e Auditoria
- Ver todos os histórico de ações administrativas
- Filtrar por tipo de ação
- Pesquisar por admin
- Rastrear mudanças

## 🔒 Segurança

### Row-Level Security (RLS)
- Todas as tabelas admin têm RLS ativado
- Apenas admins podem ver dados administrativos
- Cada utilizador só pode ver seus próprios dados
- Super admins têm acesso total

### Funcções de Validação
```typescript
// Verificar se é super admin
await isSuperAdmin(userId);

// Verificar se é admin ou superior
await isAdminOrHigher(userId);

// Obter contexto completo do admin
const context = await getAdminContext(userId);

// Proteger rota
requireAdminPermission(userId, PermissionLevel.ADMIN)
```

### Componentes Protegidos
```typescript
// React component
<ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
  <AdminContent />
</ProtectedAdminRoute>

// Hook
const { isAdmin, isSuperAdmin, permissionLevel } = useAdminContext();
```

## 📝 Logging e Auditoria

Todas as ações administrativas são registradas automaticamente em `admin_logs`:

```typescript
await logAdminAction(
  adminId,
  'user_banned',
  'user',
  userId,
  { reason: 'Violação de políticas' }
);
```

Ações rastreadas:
- `user_banned` - Utilizador bloqueado
- `user_unbanned` - Utilizador desbloqueado
- `user_verified` - Utilizador verificado
- `subscription_approved` - Assinatura aprovada
- `subscription_rejected` - Assinatura rejeitada
- `service_created` - Serviço criado
- `service_deleted` - Serviço deletado
- `zone_created` - Bairro criado
- `zone_deleted` - Bairro deletado
- `admin_added` - Admin adicionado
- `admin_promoted` - Admin promovido
- `settings_changed` - Configuração alterada

## ⚙️ Configurações Globais

Acesse `/admin/settings` para modificar:

- `subscription_trial_days` - Número de dias de trial (padrão: 7)
- `whatsapp_visibility_requirement` - Quando mostrar WhatsApp (trial/premium)
- `max_failed_login_attempts` - Máximo de tentativas (padrão: 5)
- `admin_email_notifications` - Ativar notificações por email
- `site_maintenance_mode` - Modo de manutenção do site

## 🛠️ Desenvolvimento

### Adicionar Nova Página Admin

1. Criar arquivo em `src/routes/admin.nova-pagina.tsx`
2. Importar `ProtectedAdminRoute` e `PermissionLevel`
3. Implementar componente
4. Envolver com `<ProtectedAdminRoute>`
5. Adicionar link no menu de navegação em `src/routes/admin.tsx`

### Exemplo:

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';

function AdminNovaPagina() {
  return (
    <div>
      <h1>Nova Página Admin</h1>
    </div>
  );
}

export const Route = createFileRoute('/admin/nova-pagina')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminNovaPagina />
    </ProtectedAdminRoute>
  ),
});
```

## 📞 Dados do Super Admin Inicial

```
Email: Miltonfernandoalfredo@gmail.com
Contacto: +244 947470500
Tipo: Super Admin (acesso completo)
```

## 🚨 Troubleshooting

### Não consigo acessar o painel admin
- Verifique se é um admin autorizado
- Certifique-se de que está autenticado
- Verifique se tem a role 'admin' na tabela `user_roles`

### As ações não estão sendo registadas
- Verifique se a tabela `admin_logs` existe
- Certifique-se de que a função `log_admin_action` está definida

### Erro de permissão ao modificar dados
- Verifique as RLS policies
- Confirme que é super admin para configurações
- Para operações normais, role de admin é suficiente

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [TanStack Router](https://tanstack.com/router/latest)
- [Zod Validation](https://zod.dev)

---

**Nota**: Sistema de admin completamente funcional e pronto para produção no Cloudflare Workers!
