import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminReportsTable } from '@/components/admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Denúncias de Utilizadores</h1>
        <p className="text-muted-foreground mt-2">
          Revise e resolva denúncias sobre técnicos, empresas ou outro comportamento impróprio
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>ℹ️ Sistema de Segurança:</strong> Todas as denúncias são revisadas pelos admins. Ações tomadas são registradas no log de auditoria.
        </AlertDescription>
      </Alert>

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
