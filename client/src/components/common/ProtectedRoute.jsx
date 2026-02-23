import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import { getHomeRoute } from '../../utils/routes';

function ProtectedRoute({ allowedRoles }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-600">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
