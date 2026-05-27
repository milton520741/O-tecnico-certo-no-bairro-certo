import { createFileRoute } from '@tanstack/react-router';
import { useAdminContext } from '@/hooks/use-admin-context';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/admin-permissions';

function AdminDashboard() {
  const { context } = useAdminContext();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [techniciansRes, companiesRes, subscriptionsRes, paymentsRes] = await Promise.all([
        supabase.from('technicians').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('payment_proofs').select('id', { count: 'exact', head: true }),
      ]);

      return {
        technicians: techniciansRes.count || 0,
        companies: companiesRes.count || 0,
        subscriptions: subscriptionsRes.count || 0,
        payments: paymentsRes.count || 0,
      };
    },
  });

  // Fetch pending subscriptions
  const { data: pendingSubscriptions } = useQuery({
    queryKey: ['pending-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Técnicos"
          value={stats?.technicians || 0}
          loading={isLoading}
        />
        <StatCard
          title="Empresas"
          value={stats?.companies || 0}
          loading={isLoading}
        />
        <StatCard
          title="Assinaturas"
          value={stats?.subscriptions || 0}
          loading={isLoading}
        />
        <StatCard
          title="Pagamentos"
          value={stats?.payments || 0}
          loading={isLoading}
        />
      </div>

      {/* Pending Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSubscriptions && pendingSubscriptions.length > 0 ? (
            <div className="space-y-4">
              {pendingSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{sub.plan}</p>
                    <p className="text-sm text-muted-foreground">{sub.owner_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                      Aprovar
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma assinatura pendente</p>
          )}
        </CardContent>
      </Card>

      {context?.isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Super Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você tem acesso completo a todas as funcionalidades do painel administrativo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '-' : value}</div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/admin/')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminDashboard />
    </ProtectedAdminRoute>
  ),
});
