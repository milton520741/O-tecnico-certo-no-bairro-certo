import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AdminContext, PermissionLevel } from '@/types/admin';
import { getAdminContext, isAdminOrHigher } from '@/lib/admin-permissions';

export function useAdminContext() {
  const { user } = useAuth();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        if (!user) {
          setContext(null);
          setLoading(false);
          return;
        }

        const adminContext = await getAdminContext(user.id);
        setContext(adminContext);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load admin context';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [user]);

  return {
    context,
    loading,
    error,
    isAdmin: context?.isAdmin || false,
    isSuperAdmin: context?.isSuperAdmin || false,
    permissionLevel: context?.permissionLevel || PermissionLevel.NONE,
  };
}

/**
 * Hook to check if user can perform an admin action
 */
export function useCanPerformAdminAction(minLevel: PermissionLevel = PermissionLevel.ADMIN) {
  const { context, loading } = useAdminContext();

  if (loading) return null;

  if (!context) return false;

  switch (minLevel) {
    case PermissionLevel.SUPER_ADMIN:
      return context.isSuperAdmin;
    case PermissionLevel.ADMIN:
      return context.isAdmin;
    case PermissionLevel.MODERATOR:
      return context.isAdmin || context.isSuperAdmin;
    case PermissionLevel.USER:
      return !!context.userId;
    default:
      return false;
  }
}
