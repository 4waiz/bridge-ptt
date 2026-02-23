import { Navigate, Route, Routes } from 'react-router-dom';
import useAuth from './context/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplicantPage from './pages/ApplicantPage';
import ReviewerPage from './pages/ReviewerPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingState from './components/common/LoadingState';
import { getHomeRoute } from './utils/routes';

function RootRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <LoadingState message="Loading workspace..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRoute(user.role)} replace />;
}

function PublicAuthRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <LoadingState message="Loading session..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicAuthRoute>
            <RegisterPage />
          </PublicAuthRoute>
        }
      />

      <Route element={<ProtectedRoute allowedRoles={['applicant']} />}>
        <Route path="/applicant" element={<ApplicantPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
        <Route path="/reviewer" element={<ReviewerPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

