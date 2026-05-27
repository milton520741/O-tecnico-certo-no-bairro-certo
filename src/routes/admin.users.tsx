import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminUsersTable } from '@/components/admin';

function AdminUsers() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
      <AdminUsersTable />
    </div>
  );
}

export const Route = createFileRoute('/admin/users')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminUsers />
    </ProtectedAdminRoute>
  ),
});
