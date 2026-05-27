// Types for Admin System

export type AppRole = 'technician' | 'company' | 'admin';

export interface UserRole {
  id: number;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface SuperAdmin {
  id: number;
  user_id: string;
  created_at: string;
  created_by: string | null;
}

export interface AdminLog {
  id: number;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_data: Record<string, any> | null;
  changes: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminSetting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color_hex: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: number;
  admin_id: string;
  type: string;
  title: string;
  description: string | null;
  related_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface UserReport {
  id: number;
  reporter_id: string | null;
  reported_user_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  assigned_to: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AdminDashboardConfig {
  id: number;
  admin_id: string;
  widget_type: string;
  is_visible: boolean;
  position: number | null;
  settings: Record<string, any>;
}

// Permission Levels
export enum PermissionLevel {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  NONE = 'none',
}

// Admin Actions
export enum AdminAction {
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  USER_VERIFIED = 'user_verified',
  SUBSCRIPTION_APPROVED = 'subscription_approved',
  SUBSCRIPTION_REJECTED = 'subscription_rejected',
  SERVICE_CREATED = 'service_created',
  SERVICE_UPDATED = 'service_updated',
  SERVICE_DELETED = 'service_deleted',
  ZONE_CREATED = 'zone_created',
  ZONE_UPDATED = 'zone_updated',
  ZONE_DELETED = 'zone_deleted',
  ADMIN_ADDED = 'admin_added',
  ADMIN_REMOVED = 'admin_removed',
  SETTINGS_CHANGED = 'settings_changed',
}

// Admin Context
export interface AdminContext {
  userId: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  permissionLevel: PermissionLevel;
}

// API Response Types
export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
