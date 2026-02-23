import { Link } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { getHomeRoute } from '../utils/routes';

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="section-stack">
      <section className="card-elevated relative overflow-hidden p-6 sm:p-8 lg:p-12">
        <img
          src="/bridge-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 right-0 hidden h-72 w-72 translate-x-12 opacity-[0.08] md:block lg:h-96 lg:w-96"
        />

        <div className="relative z-10 max-w-hero space-y-4 sm:space-y-6">
          <p className="kicker">Bridge Edge Learning and Innovation Factory</p>
          <h1 className="max-w-prose text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Part-time opportunities with a clean, fast application flow.
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
            Build your profile, upload your resume and certificates, and share what you offer to BRIDGE in minutes.
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary">
                Apply
              </Link>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link to={getHomeRoute(user.role)} className="btn-primary">
                Go to {user.role === 'reviewer' ? 'Reviewer Desk' : 'Apply'}
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-surface flex h-full flex-col p-6">
          <h2 className="text-xl font-black text-slate-900">1. Build Your Profile</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Add your photo, availability, location, and skills so teams can assess fit quickly.
          </p>
        </article>

        <article className="card-surface flex h-full flex-col p-6">
          <h2 className="text-xl font-black text-slate-900">2. Upload Documents</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Submit your resume and certificates in one place with clear status tracking.
          </p>
        </article>

        <article className="card-surface flex h-full flex-col p-6">
          <h2 className="text-xl font-black text-slate-900">3. Track Progress</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Reviewer updates appear in your dashboard, so you always know your latest status.
          </p>
        </article>
      </section>
    </div>
  );
}

export default HomePage;
