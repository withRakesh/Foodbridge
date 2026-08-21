import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps any route tree that requires a logged-in user, regardless of role.
// Usage: <Route element={<PrivateRoute />}>...protected routes...</Route>
export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullScreenSpinner />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-primary" />
    </div>
  );
}
