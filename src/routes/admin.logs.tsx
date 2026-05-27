import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminLogsTable } from '@/components/admin';

function AdminLogs() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registos de Atividade</h1>
      <AdminLogsTable />
    </div>
  );
}

export const Route = createFileRoute('/admin/logs')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminLogs />
    </ProtectedAdminRoute>
  ),
});
