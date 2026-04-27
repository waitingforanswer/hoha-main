import { Navigate, useLocation } from 'react-router-dom';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Loader2 } from 'lucide-react';

interface AppProtectedRouteProps {
  children: React.ReactNode;
}

export function AppProtectedRoute({ children }: AppProtectedRouteProps) {
  const { user, loading } = useAppAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
