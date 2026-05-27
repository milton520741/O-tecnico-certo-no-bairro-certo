import { ReactNode } from 'react';
import { useAdminContext } from '@/hooks/use-admin-context';
import { PermissionLevel } from '@/types/admin';

interface ProtectedAdminRouteProps {
  children: ReactNode;
  minLevel?: PermissionLevel;
  fallback?: ReactNode;
}

export function ProtectedAdminRoute({
  children,
  minLevel = PermissionLevel.ADMIN,
  fallback,
}: ProtectedAdminRouteProps) {
  const { context, loading } = useAdminContext();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!context) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      )
    );
  }

  let hasPermission = false;
  switch (minLevel) {
    case PermissionLevel.SUPER_ADMIN:
      hasPermission = context.isSuperAdmin;
      break;
    case PermissionLevel.ADMIN:
      hasPermission = context.isAdmin;
      break;
    case PermissionLevel.MODERATOR:
      hasPermission = context.isAdmin || context.isSuperAdmin;
      break;
    case PermissionLevel.USER:
      hasPermission = !!context.userId;
      break;
  }

  if (!hasPermission) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
