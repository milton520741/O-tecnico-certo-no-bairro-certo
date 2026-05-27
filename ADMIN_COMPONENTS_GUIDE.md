# Componentes Admin - Guia de Uso

## 📋 Componentes Disponíveis

### 1. AdminUsersTable
Gerencia lista de técnicos e empresas com opções de banir.

```tsx
import { AdminUsersTable } from '@/components/admin';

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
      <AdminUsersTable />
    </div>
  );
}
```

**Features:**
- ✅ Listar técnicos e empresas
- ✅ Verificar status (verificado, premium, banido)
- ✅ Banir utilizadores com motivo
- ✅ Real-time updates com React Query

---

### 2. AdminSubscriptionsTable
Aprova/rejeita assinaturas pendentes.

```tsx
import { AdminSubscriptionsTable } from '@/components/admin';

export function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Assinaturas</h1>
      <AdminSubscriptionsTable />
    </div>
  );
}
```

**Features:**
- ✅ Listar assinaturas por status
- ✅ Aprovar assinaturas
- ✅ Rejeitar assinaturas
- ✅ Ver datas de início/fim

---

### 3. AdminLogsTable
Visualiza todos os logs de atividade admin.

```tsx
import { AdminLogsTable } from '@/components/admin';

export function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registos de Atividade</h1>
      <AdminLogsTable limit={100} />
    </div>
  );
}
```

**Features:**
- ✅ Filtro por ação (created, updated, banned, etc)
- ✅ Ver alterações em JSON
- ✅ Timestamps em português
- ✅ Paginação configurável

---

### 4. AdminReportsTable
Gerencia denúncias de utilizadores.

```tsx
import { AdminReportsTable } from '@/components/admin';

export function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Denúncias</h1>
      <AdminReportsTable />
    </div>
  );
}
```

**Features:**
- ✅ Listar denúncias com prioridade
- ✅ Modal de detalhes
- ✅ Resolver/rejeitar denúncias
- ✅ Adicionar resolução

---

## 🔧 Integração com Rotas

Atualize suas rotas admin para usar os componentes:

**src/routes/admin.users.tsx:**
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { AdminUsersTable } from '@/components/admin';

export const Route = createFileRoute('/admin/users')({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Utilizadores</h1>
      <AdminUsersTable />
    </div>
  ),
});
```

**src/routes/admin.subscriptions.tsx:**
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { AdminSubscriptionsTable } from '@/components/admin';

export const Route = createFileRoute('/admin/subscriptions')({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assinaturas</h1>
      <AdminSubscriptionsTable />
    </div>
  ),
});
```

**src/routes/admin.logs.tsx:**
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { AdminLogsTable } from '@/components/admin';

export const Route = createFileRoute('/admin/logs')({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registos</h1>
      <AdminLogsTable limit={50} />
    </div>
  ),
});
```

**src/routes/admin.reports.tsx:**
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { AdminReportsTable } from '@/components/admin';

export const Route = createFileRoute('/admin/reports')({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Denúncias</h1>
      <AdminReportsTable />
    </div>
  ),
});
```

---

## 🎨 Customização

### Alterar cores de status:
Cada componente tem funções `getStatusColor()` e `getPriorityColor()`.

### Adicionar colunas:
Edite o `<Table>` dentro de cada componente.

### Usar dados locais:
Remova a `useQuery` e passe dados via props.

---

## 🔒 Requisitos de Segurança

Todos os componentes requerem:
1. ✅ User autenticado
2. ✅ Role = 'admin'
3. ✅ RLS policies no Supabase ativado

Verifique com `useAdminContext()`:
```tsx
const { context } = useAdminContext();
if (!context?.isAdmin) return <AccessDenied />;
```

---

## 📱 Próximos Passos

1. [ ] Adicionar filtros avançados
2. [ ] Exportar dados para CSV
3. [ ] Dashboard com gráficos
4. [ ] Notificações em tempo real
5. [ ] Gestão de permissões granulares

---

**Data:** 27/05/2026
**Status:** ✅ Completo e pronto para uso
