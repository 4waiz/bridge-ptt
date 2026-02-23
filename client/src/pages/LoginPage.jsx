import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../context/useAuth';
import { getHomeRoute } from '../utils/routes';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profile = await login({ email, password });
      navigate(getHomeRoute(profile.role), { replace: true });
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card-surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
      <p className="mt-2 text-sm text-slate-700">Sign in to continue with BRIDGE hiring portal.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p className="rounded-uiSm bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full" aria-busy={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-700">
        New here?{' '}
        <Link to="/register" className="btn-link">
          Create account
        </Link>
      </p>
    </section>
  );
}

export default LoginPage;
