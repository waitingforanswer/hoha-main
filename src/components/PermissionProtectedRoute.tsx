import { Navigate, useLocation } from 'react-router-dom';
import { useAppAuth } from '@/hooks/useAppAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  redirectTo?: string;
}

export function PermissionProtectedRoute({ 
  children, 
  requiredPermission,
  redirectTo = "/login"
}: PermissionProtectedRouteProps) {
  const { user, loading } = useAppAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Logged in but no permission - show access denied
  if (!hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-4">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </p>
          <a href="/" className="text-primary hover:underline">
            Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
