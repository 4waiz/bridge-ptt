import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import LoadingState from './LoadingState';
import { getHomeRoute } from '../../utils/routes';

function ProtectedRoute({ allowedRoles }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <LoadingState message="Checking session..." />;
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

