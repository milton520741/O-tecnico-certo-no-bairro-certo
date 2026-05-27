import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminReportsTable } from '@/components/admin';

function AdminReports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Denúncias de Utilizadores</h1>
      <AdminReportsTable />
    </div>
  );
}

export const Route = createFileRoute('/admin/reports')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminReports />
    </ProtectedAdminRoute>
  ),
});
