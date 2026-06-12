import { createFileRoute } from '@tanstack/react-router';
import { useAdminContext } from '@/hooks/use-admin-context';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/admin-permissions';
import { AlertTriangle, CheckCircle2, Clock, FileText, TrendingUp, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function AdminDashboard() {
  const { context } = useAdminContext();

  // Fetch all dashboard stats in parallel
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats-complete'],
    queryFn: async () => {
      const [
        techniciansRes,
        companiesRes,
        subscriptionsRes,
        paymentsRes,
        verifiedTechRes,
        bannedTechRes,
        verifiedCompRes,
        bannedCompRes,
        reportsRes,
        adminLogsRes,
      ] = await Promise.all([
        supabase.from('technicians').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('payment_proofs').select('id', { count: 'exact', head: true }),
        supabase.from('technicians').select('id', { count: 'exact', head: true }).not('verified_by', 'is', null),
        supabase.from('technicians').select('id', { count: 'exact', head: true }).not('banned_by', 'is', null),
        supabase.from('companies').select('id', { count: 'exact', head: true }).not('verified_by', 'is', null),
        supabase.from('companies').select('id', { count: 'exact', head: true }).not('banned_by', 'is', null),
        supabase.from('user_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('admin_logs').select('id', { count: 'exact', head: true }).order('created_at', { ascending: false }).limit(1),
      ]);

      return {
        technicians: techniciansRes.count || 0,
        companies: companiesRes.count || 0,
        subscriptions: subscriptionsRes.count || 0,
        payments: paymentsRes.count || 0,
        verifiedTechs: verifiedTechRes.count || 0,
        bannedTechs: bannedTechRes.count || 0,
        verifiedComps: verifiedCompRes.count || 0,
        bannedComps: bannedCompRes.count || 0,
        pendingReports: reportsRes.count || 0,
      };
    },
  });

  // Fetch subscription breakdown
  const { data: subscriptionBreakdown } = useQuery({
    queryKey: ['subscription-breakdown'],
    queryFn: async () => {
      const [activeRes, pendingRes, rejectedRes] = await Promise.all([
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      return {
        active: activeRes.count || 0,
        pending: pendingRes.count || 0,
        rejected: rejectedRes.count || 0,
      };
    },
  });

  // Fetch payment proofs breakdown
  const { data: paymentsBreakdown } = useQuery({
    queryKey: ['payments-breakdown'],
    queryFn: async () => {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        supabase.from('payment_proofs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payment_proofs').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('payment_proofs').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      return {
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        rejected: rejectedRes.count || 0,
      };
    },
  });

  // Fetch pending subscriptions with details
  const { data: pendingSubscriptions } = useQuery({
    queryKey: ['pending-subscriptions-detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          owner_id,
          plan,
          created_at,
          technician:technicians(id, full_name, email),
          company:companies(id, name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending payment proofs
  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments-detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`
          id,
          subscription_id,
          amount,
          proof_url,
          created_at,
          subscription:subscriptions(id, plan, owner_id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending reports
  const { data: pendingReports } = useQuery({
    queryKey: ['pending-reports-detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          id,
          reported_user_id,
          reason,
          priority,
          created_at
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const totalPending = (subscriptionBreakdown?.pending || 0) + (paymentsBreakdown?.pending || 0) + (stats?.pendingReports || 0);
  const hasUrgentActions = totalPending > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {context?.isSuperAdmin ? '🔐 Super Admin' : '👤 Admin'}
        </p>
      </div>

      {/* Urgent Actions Alert */}
      {hasUrgentActions && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>⚠️ {totalPending} ações pendentes:</strong> {subscriptionBreakdown?.pending || 0} assinaturas, {paymentsBreakdown?.pending || 0} pagamentos, {stats?.pendingReports || 0} denúncias
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Técnicos"
          value={stats?.technicians || 0}
          subtitle={`${stats?.verifiedTechs || 0} verificados`}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
          href="/admin/users"
        />
        <StatCard
          title="Empresas"
          value={stats?.companies || 0}
          subtitle={`${stats?.verifiedComps || 0} verificadas`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={isLoading}
          href="/admin/users"
        />
        <StatCard
          title="Assinaturas"
          value={stats?.subscriptions || 0}
          subtitle={`${subscriptionBreakdown?.active || 0} ativas`}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          loading={isLoading}
          href="/admin/subscriptions"
        />
        <StatCard
          title="Comprovantes"
          value={stats?.payments || 0}
          subtitle={`${paymentsBreakdown?.pending || 0} pendentes`}
          icon={<FileText className="h-4 w-4 text-blue-600" />}
          loading={isLoading}
          href="/admin/payment-proofs"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DetailStatCard
          title="Status Assinaturas"
          stats={[
            { label: 'Ativas', value: subscriptionBreakdown?.active || 0, color: 'bg-green-100 text-green-800' },
            { label: 'Pendentes', value: subscriptionBreakdown?.pending || 0, color: 'bg-amber-100 text-amber-800' },
            { label: 'Rejeitadas', value: subscriptionBreakdown?.rejected || 0, color: 'bg-red-100 text-red-800' },
          ]}
          loading={isLoading}
        />

        <DetailStatCard
          title="Status Comprovantes"
          stats={[
            { label: 'Aprovados', value: paymentsBreakdown?.approved || 0, color: 'bg-green-100 text-green-800' },
            { label: 'Pendentes', value: paymentsBreakdown?.pending || 0, color: 'bg-amber-100 text-amber-800' },
            { label: 'Rejeitados', value: paymentsBreakdown?.rejected || 0, color: 'bg-red-100 text-red-800' },
          ]}
          loading={isLoading}
        />

        <DetailStatCard
          title="Segurança"
          stats={[
            { label: 'Denúncias Pendentes', value: stats?.pendingReports || 0, color: 'bg-red-100 text-red-800' },
            { label: 'Técnicos Banidos', value: stats?.bannedTechs || 0, color: 'bg-red-100 text-red-800' },
            { label: 'Empresas Banidas', value: stats?.bannedComps || 0, color: 'bg-red-100 text-red-800' },
          ]}
          loading={isLoading}
        />
      </div>

      {/* Action Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Assinaturas Pendentes
              {subscriptionBreakdown?.pending ? (
                <Badge variant="destructive">{subscriptionBreakdown.pending}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSubscriptions && pendingSubscriptions.length > 0 ? (
              <div className="space-y-3">
                {pendingSubscriptions.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {sub.technician?.full_name ? `👨‍🔧 ${sub.technician.full_name}` : sub.company?.name ? `🏢 ${sub.company.name}` : 'Utilizador'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plano: <strong>{sub.plan}</strong> • {new Date(sub.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <Link to={`/admin/subscriptions`}>
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">✅ Nenhuma assinatura pendente</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Payment Proofs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Comprovantes de Pagamento
              {paymentsBreakdown?.pending ? (
                <Badge variant="destructive">{paymentsBreakdown.pending}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments && pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Assinatura #{payment.subscription_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plano: <strong>{payment.subscription?.plan ?? payment.plan}</strong> • {new Date(payment.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <a href={payment.proof_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        Ver Prova
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">✅ Nenhum comprovante pendente</p>
            )}
          </CardContent>
        </Card>

        {/* View all Payment Proofs Link */}
        {paymentsBreakdown?.pending ? (
          <Link to={`/admin/payment-proofs`}>
            <Button className="w-full" variant="outline">
              Ver Todos os Comprovantes ({paymentsBreakdown.pending} pendentes)
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Pending Reports */}
      {stats?.pendingReports ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Denúncias Pendentes
              <Badge variant="destructive">{stats.pendingReports}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReports && pendingReports.length > 0 ? (
              <div className="space-y-3">
                {pendingReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Denúncia #{report.id}</p>
                        <Badge
                          variant={
                            report.priority === 'critical'
                              ? 'destructive'
                              : report.priority === 'high'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {report.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {report.reason} • {new Date(report.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <Link to={`/admin/reports`}>
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">✅ Nenhuma denúncia pendente</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Super Admin Info */}
      {context?.isSuperAdmin && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🔐 Acesso Super Admin:</strong> Você tem permissão total para gerenciar admins, settings e todas as funcionalidades do sistema.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading: boolean;
  href?: string;
}

function StatCard({ title, value, subtitle, icon, loading, href }: StatCardProps) {
  const content = (
    <Card className={href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '-' : value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

interface DetailStat {
  label: string;
  value: number;
  color: string;
}

interface DetailStatCardProps {
  title: string;
  stats: DetailStat[];
  loading: boolean;
}

function DetailStatCard({ title, stats, loading }: DetailStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <Badge className={`${stat.color} font-bold`}>
                {loading ? '-' : stat.value}
              </Badge>
            </div>
          ))}
        </div>
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
