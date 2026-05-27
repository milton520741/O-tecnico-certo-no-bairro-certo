import { createClient } from '@supabase/supabase-js';
import { AdminContext, PermissionLevel } from '@/types/admin';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Check if a user is an admin or higher
 */
export async function isAdminOrHigher(userId: string): Promise<boolean> {
  try {
    // Check if super admin first
    if (await isSuperAdmin(userId)) return true;

    // Check if regular admin
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get admin context for a user
 */
export async function getAdminContext(userId: string): Promise<AdminContext> {
  const isSuper = await isSuperAdmin(userId);
  const isAdmin = !isSuper && (await isAdminOrHigher(userId));

  let permissionLevel = PermissionLevel.NONE;
  if (isSuper) {
    permissionLevel = PermissionLevel.SUPER_ADMIN;
  } else if (isAdmin) {
    permissionLevel = PermissionLevel.ADMIN;
  } else {
    // Check if moderator (just verify access, basic users can't be moderators in this system)
    permissionLevel = PermissionLevel.USER;
  }

  return {
    userId,
    isSuperAdmin: isSuper,
    isAdmin: isAdmin || isSuper,
    permissionLevel,
  };
}

/**
 * Verify admin permission for a route
 */
export async function requireAdminPermission(
  userId: string | undefined,
  minLevel: PermissionLevel = PermissionLevel.ADMIN
): Promise<boolean> {
  if (!userId) return false;

  const context = await getAdminContext(userId);

  switch (minLevel) {
    case PermissionLevel.SUPER_ADMIN:
      return context.isSuperAdmin;
    case PermissionLevel.ADMIN:
      return context.isAdmin;
    case PermissionLevel.MODERATOR:
      return context.isAdmin || context.isSuperAdmin;
    case PermissionLevel.USER:
      return !!userId;
    default:
      return false;
  }
}

/**
 * Log an admin action
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  entityData?: Record<string, any> | null,
  changes?: Record<string, any> | null
): Promise<boolean> {
  try {
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_data: entityData || null,
      changes: changes || null,
      created_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Ban a user
 */
export async function banUser(
  userId: string,
  bannedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin
    if (!(await isAdminOrHigher(bannedBy))) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Call the ban_user function
    const { error } = await supabase.rpc('ban_user', {
      _user_id: userId,
      _banned_by: bannedBy,
      _reason: reason || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Unban a user
 */
export async function unbanUser(
  userId: string,
  unbannedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin
    if (!(await isAdminOrHigher(unbannedBy))) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Call the unban_user function
    const { error } = await supabase.rpc('unban_user', {
      _user_id: userId,
      _unbanned_by: unbannedBy,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify a user
 */
export async function verifyUser(
  userId: string,
  verifiedBy: string,
  isTechnician: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin
    if (!(await isAdminOrHigher(verifiedBy))) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Call the verify_user function
    const { error } = await supabase.rpc('verify_user', {
      _user_id: userId,
      _verified_by: verifiedBy,
      _is_technician: isTechnician,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
