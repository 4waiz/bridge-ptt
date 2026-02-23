import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import SiteLayout from './components/layout/SiteLayout';
import useAuth from './context/useAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplicantPage from './pages/ApplicantPage';
import ReviewerPage from './pages/ReviewerPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';
import FirebaseSetupPage from './pages/FirebaseSetupPage';
import { getHomeRoute } from './utils/routes';
import { firebaseInitError, firebaseReady, missingFirebaseConfig } from './firebase';

function PublicOnlyRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <div className="rounded-3xl bg-white/80 p-8 text-center text-slate-600">Loading...</div>;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
}

function App() {
  if (!firebaseReady) {
    return (
      <Routes>
        <Route element={<SiteLayout />}>
          <Route
            path="*"
            element={<FirebaseSetupPage missingKeys={missingFirebaseConfig} initError={firebaseInitError} />}
          />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        <Route element={<ProtectedRoute allowedRoles={['applicant']} />}>
          <Route path="/applicant" element={<ApplicantPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
          <Route path="/reviewer" element={<ReviewerPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['applicant', 'reviewer']} />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
