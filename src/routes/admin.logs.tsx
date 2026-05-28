import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { AdminLogsTable } from '@/components/admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

function AdminLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registos de Atividade (Auditoria)</h1>
        <p className="text-muted-foreground mt-2">
          Todas as ações realizadas pelos admins são registadas para fins de auditoria e segurança
        </p>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>🔒 Auditoria Completa:</strong> IP, User-Agent, timestamp e mudanças são registadas automaticamente em todas as ações.
        </AlertDescription>
      </Alert>

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
