import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../context/useAuth';
import { getHomeRoute } from '../utils/routes';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form);
      navigate(getHomeRoute(user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <div className="card-surface w-full p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recruiting Campaign Tool</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign In</h1>
        <p className="mt-2 text-sm text-slate-600">Access applicant, reviewer, or admin workspace.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>Seeded admin: admin@system.com / 1234</p>
          <p>Seeded reviewer: reviewer@system.com / 1234</p>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          New applicant?{' '}
          <Link to="/register" className="font-semibold text-slate-900 underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

