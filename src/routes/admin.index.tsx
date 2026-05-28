import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAdminContext } from '@/hooks/use-admin-context';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/admin-permissions';
import {
  Users,
  Building2,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function AdminDashboard() {
  const navigate = useNavigate();
  const { context } = useAdminContext();

  // Fetch comprehensive dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats-full'],
    queryFn: async () => {
      const [
        techniciansRes,
        companiesRes,
        subscriptionsRes,
        activeSubsRes,
        pendingSubsRes,
        reportsRes,
      ] = await Promise.all([
        supabase.from('technicians').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('user_reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      return {
        technicians: techniciansRes.count || 0,
        companies: companiesRes.count || 0,
        totalSubscriptions: subscriptionsRes.count || 0,
        activeSubscriptions: activeSubsRes.count || 0,
        pendingSubscriptions: pendingSubsRes.count || 0,
        pendingReports: reportsRes.count || 0,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch pending subscriptions with user details
  const { data: pendingSubscriptions = [] } = useQuery({
    queryKey: ['pending-subscriptions-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan,
          status,
          created_at,
          owner_id,
          profiles:owner_id(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending reports
  const { data: pendingReports = [] } = useQuery({
    queryKey: ['pending-reports-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select('id, reason, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
  });

  const PLAN_PRICES: Record<string, { label: string; price: number }> = {
    simples: { label: 'Simples', price: 1000 },
    premium: { label: 'Premium', price: 2000 },
    empresa_mensal: { label: 'Empresa', price: 10000 },
  };

  const handleNavigate = (path: string) => {
    navigate({ to: path });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-gray-600">
          Última atualização: {new Date().toLocaleTimeString('pt-PT')}
        </p>
      </div>

      {/* Critical Alerts */}
      {(stats?.pendingSubscriptions || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">
              ⚠️ {stats?.pendingSubscriptions} Assinatura(s) Pendente(s)
            </h3>
            <p className="text-sm text-yellow-800">
              Existem assinaturas aguardando aprovação. Clique no botão abaixo para revê-las.
            </p>
            <Button
              size="sm"
              className="mt-2 bg-yellow-600 hover:bg-yellow-700"
              onClick={() => handleNavigate({ to: '/admin/subscriptions' })}
            >
              Ver Assinaturas Pendentes
            </Button>
          </div>
        </div>
      )}

      {(stats?.pendingReports || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              🚨 {stats?.pendingReports} Denúncia(s) Pendente(s)
            </h3>
            <p className="text-sm text-red-800">
              Existem denúncias de utilizadores que precisam de atenção.
            </p>
            <Button
              size="sm"
              className="mt-2 bg-red-600 hover:bg-red-700"
              onClick={() => handleNavigate({ to: '/admin/reports' })}
            >
              Ver Denúncias
            </Button>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="👨‍💼 Técnicos Registados"
          value={stats?.technicians || 0}
          loading={isLoading}
          icon={Users}
          color="blue"
          action={() => handleNavigate({ to: '/admin/users' })}
        />
        <StatCard
          title="🏢 Empresas Registadas"
          value={stats?.companies || 0}
          loading={isLoading}
          icon={Building2}
          color="purple"
          action={() => handleNavigate({ to: '/admin/users' })}
        />
        <StatCard
          title="✓ Assinaturas Ativas"
          value={stats?.activeSubscriptions || 0}
          loading={isLoading}
          icon={CheckCircle}
          color="green"
          action={() => handleNavigate({ to: '/admin/subscriptions' })}
        />
        <StatCard
          title="⏳ Assinaturas Pendentes"
          value={stats?.pendingSubscriptions || 0}
          loading={isLoading}
          icon={Clock}
          color="yellow"
          action={() => handleNavigate({ to: '/admin/subscriptions' })}
          highlight={stats?.pendingSubscriptions || 0 > 0}
        />
      </div>

      {/* Pending Subscriptions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <CardTitle>Assinaturas Pendentes</CardTitle>
              <Badge variant="outline" className="ml-2">
                {pendingSubscriptions.length}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate({ to: '/admin/subscriptions' })}
            >
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Data de Submissão</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSubscriptions.map((sub: any) => (
                    <TableRow key={sub.id} className="hover:bg-yellow-50">
                      <TableCell className="font-medium">
                        {sub.profiles?.full_name || 'Sem nome'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PLAN_PRICES[sub.plan]?.label || sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {PLAN_PRICES[sub.plan]?.price.toLocaleString('pt-AO')} Kz
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigate({ to: '/admin/subscriptions' })}
                        >
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              ✓ Nenhuma assinatura pendente! Tudo atualizado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Reports Section */}
      {pendingReports.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-900">Denúncias Pendentes</CardTitle>
                <Badge variant="destructive" className="ml-2">
                  {pendingReports.length}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate({ to: '/admin/reports' })}
              >
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-red-50 p-4 rounded border border-red-200 hover:bg-red-100 cursor-pointer transition"
                  onClick={() => handleNavigate({ to: '/admin/reports' })}
                >
                  <p className="font-semibold text-red-900 mb-1">{report.reason}</p>
                  <p className="text-sm text-red-700">
                    Reportado: {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/subscriptions' })}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Aprovar Assinaturas</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/users' })}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Gestão Utilizadores</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/reports' })}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs">Ver Denúncias</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/logs' })}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Histórico de Ações</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/services' })}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Gestão Serviços</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-1"
              onClick={() => handleNavigate({ to: '/admin/zones' })}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs">Gestão Bairros</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Info Card */}
      {context?.isSuperAdmin && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>👑 Status Super Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-700">
              Você tem acesso completo a todas as funcionalidades do painel administrativo.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate({ to: '/admin/admins' })}
              >
                Gerenciar Admins
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate({ to: '/admin/settings' })}
              >
                Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red';
  action?: () => void;
  highlight?: boolean;
}

function StatCard({ title, value, loading, icon: Icon, color, action, highlight }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    red: 'bg-red-50 text-red-900 border-red-200',
  };

  return (
    <Card
      className={`cursor-pointer transition hover:shadow-lg border-2 ${colorClasses[color]} ${highlight ? 'ring-2 ring-offset-2' : ''}`}
      onClick={action}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Icon className="w-5 h-5 opacity-60" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{loading ? '—' : value}</div>
        <p className="text-xs opacity-75 mt-1">Clique para detalhes</p>
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

