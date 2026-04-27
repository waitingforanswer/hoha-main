import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean; // If true, only full admin can access (not sub-admin)
  requiredPermission?: string; // Permission code required to access
}

export function AdminProtectedRoute({ 
  children, 
  redirectTo = "/admin/login",
  requireAdmin = false,
  requiredPermission
}: AdminProtectedRouteProps) {
  const { isAuthenticated, canAccessAdmin, isAdmin, hasPermission, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!canAccessAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // If requireAdmin is true, check if user is full admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-4">
            Chỉ quản trị viên chính mới có quyền truy cập trang này.
          </p>
          <a href="/admin" className="text-primary hover:underline">
            Quay về Dashboard
          </a>
        </div>
      </div>
    );
  }

  // If requiredPermission is specified, check if user has that permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-4">
            Bạn không có quyền truy cập tính năng này.
          </p>
          <a href="/admin" className="text-primary hover:underline">
            Quay về Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
