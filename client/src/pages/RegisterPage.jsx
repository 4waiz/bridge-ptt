import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../context/useAuth';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      navigate('/applicant', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <div className="card-surface w-full p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Applicant Onboarding</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">Register as an applicant to submit your profile.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="label">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input"
              value={form.name}
              onChange={handleChange}
            />
          </div>

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
              minLength={4}
              className="input"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;

