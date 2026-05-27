import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminSubscriptionsTable } from '@/components/admin';

function AdminSubscriptions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Assinaturas</h1>
      <AdminSubscriptionsTable />
    </div>
  );
}

export const Route = createFileRoute('/admin/subscriptions')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminSubscriptions />
    </ProtectedAdminRoute>
  ),
});
