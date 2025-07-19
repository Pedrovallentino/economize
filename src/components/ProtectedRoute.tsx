import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

/**
 * Props para o componente ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * @param children - Componentes filhos a serem renderizados se autenticado
 * @returns Componente filho ou redirecionamento para login
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Renderiza os componentes filhos se autenticado
  return <>{children}</>;
};