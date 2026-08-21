import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenSpinner } from './PrivateRoute';

// Wraps a route tree that requires both authentication AND a specific role.
// Usage: <Route element={<RoleRoute allowed={['ngo']} />}>...</Route>
// Mirrors the backend's authorize(...roles) middleware — keep the allowed
// lists here in sync with each route's backend `authorize()` call.
export default function RoleRoute({ allowed = [] }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <FullScreenSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
