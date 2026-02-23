import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../context/useAuth';
import { USER_ROLES, getHomeRoute } from '../utils/routes';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.APPLICANT,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profile = await register(form);
      navigate(getHomeRoute(profile.role), { replace: true });
    } catch {
      setError('Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card-surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-3xl font-black text-slate-900">Create BRIDGE Account</h1>
      <p className="mt-2 text-sm text-slate-700">Two user roles: applicants and BRIDGE reviewers.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
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
            minLength={6}
            className="input"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="role">
            I am
          </label>
          <select
            id="role"
            className="input"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value={USER_ROLES.APPLICANT}>Looking for part-time work</option>
            <option value={USER_ROLES.REVIEWER}>BRIDGE reviewer/team member</option>
          </select>
        </div>

        {error && <p className="rounded-uiSm bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full" aria-busy={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-700">
        Already have an account?{' '}
        <Link to="/login" className="btn-link">
          Sign in
        </Link>
      </p>
    </section>
  );
}

export default RegisterPage;
