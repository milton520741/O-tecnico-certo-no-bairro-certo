import { createFileRoute } from '@tanstack/react-router';
import { useAdminContext } from '@/hooks/use-admin-context';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { AdminPaymentProofsTable } from '@/components/admin/AdminPaymentProofsTable';
import { PermissionLevel } from '@/types/admin';

function AdminPaymentProofs() {
  const { context } = useAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comprovantes de Pagamento</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie e revise os comprovantes de pagamento enviados pelos técnicos e empresas
        </p>
      </div>

      <AdminPaymentProofsTable />
    </div>
  );
}

export const Route = createFileRoute('/admin/payment-proofs')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminPaymentProofs />
    </ProtectedAdminRoute>
  ),
});
