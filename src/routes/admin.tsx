import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { useAdminContext } from '@/hooks/use-admin-context';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { context, loading } = useAdminContext();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!context || !context.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar o painel administrativo.</p>
          <Link to="/" className="inline-block mt-4">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar text-sidebar-foreground border-r transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-lg">Admin</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <AdminNavLink to="/admin" label="Dashboard" open={sidebarOpen} />
          <AdminNavLink to="/admin/users" label="Utilizadores" open={sidebarOpen} />
          <AdminNavLink to="/admin/subscriptions" label="Assinaturas" open={sidebarOpen} />
          <AdminNavLink to="/admin/services" label="Serviços" open={sidebarOpen} />
          <AdminNavLink to="/admin/zones" label="Bairros" open={sidebarOpen} />
          <AdminNavLink to="/admin/reports" label="Denúncias" open={sidebarOpen} />
          <AdminNavLink to="/admin/logs" label="Registos" open={sidebarOpen} />
          {context.isSuperAdmin && (
            <>
              <div className="border-t my-4" />
              <AdminNavLink to="/admin/settings" label="Definições" open={sidebarOpen} />
              <AdminNavLink to="/admin/admins" label="Gestão Admin" open={sidebarOpen} />
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          {sidebarOpen && (
            <div className="text-xs">
              <p className="font-semibold">Conectado como:</p>
              <p className="text-muted-foreground truncate">{context.userId}</p>
              {context.isSuperAdmin && <p className="text-yellow-600 font-semibold mt-1">Super Admin</p>}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Painel Administrativo</h2>
          <Link to="/">
            <Button variant="outline" size="sm">
              Sair do Painel
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNavLink({
  to,
  label,
  open,
}: {
  to: string;
  label: string;
  open: boolean;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className: 'bg-primary text-primary-foreground',
      }}
      className="block px-4 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent transition-colors"
    >
      {open ? label : label.charAt(0)}
    </Link>
  );
}

export const Route = createFileRoute('/admin')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminLayout />
    </ProtectedAdminRoute>
  ),
});
