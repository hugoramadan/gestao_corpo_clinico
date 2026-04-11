import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuthUser } from '../types';

interface Props {
  children: React.ReactNode;
  roles?: AuthUser['role'][];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Força troca de senha antes de acessar qualquer outra rota
  if (user.must_change_password && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
