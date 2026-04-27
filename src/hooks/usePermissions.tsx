import { useAppAuth } from './useAppAuth';

export function usePermissions() {
  const { user, permissions } = useAppAuth();

  const hasPermission = (permissionCode: string): boolean => {
    if (!user || !permissions) return false;
    
    // Admin has all permissions (indicated by "*")
    if (permissions.includes("*")) return true;
    
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!user || !permissions) return false;
    if (permissions.includes("*")) return true;
    
    return permissionCodes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (!user || !permissions) return false;
    if (permissions.includes("*")) return true;
    
    return permissionCodes.every(code => permissions.includes(code));
  };

  const isAdmin = permissions?.includes("*") ?? false;

  return {
    permissions: permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
}

// Permission constants
export const PERMISSIONS = {
  VIEW_FAMILY_TREE: 'VIEW_FAMILY_TREE',
  VIEW_MEMBER_DETAIL: 'VIEW_MEMBER_DETAIL',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];
