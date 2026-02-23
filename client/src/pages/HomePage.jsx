import { Link } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { getHomeRoute } from '../utils/routes';

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="section-stack">
      <section className="card-elevated relative overflow-hidden p-6 sm:p-8 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] items-center justify-center px-6 lg:flex"
        >
          <div className="w-full rounded-uiLg border border-brandDark/10 bg-gradient-to-br from-brandPrimary/10 via-white/90 to-brandDark/10 p-6 shadow-ui">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brandDark/80">Quick Apply Checklist</p>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
              <li className="rounded-uiSm bg-white/80 px-3 py-2">1. Profile details</li>
              <li className="rounded-uiSm bg-white/80 px-3 py-2">2. Resume upload</li>
              <li className="rounded-uiSm bg-white/80 px-3 py-2">3. Certificates + availability</li>
              <li className="rounded-uiSm bg-white/80 px-3 py-2">4. Submit and track status</li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 max-w-hero space-y-4 sm:space-y-6 lg:max-w-[58%]">
          <p className="kicker">Part-Time Opportunities Portal</p>
          <h1 className="max-w-prose text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Part-time opportunities with a clean, fast application flow.
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
            Build your profile, upload your resume and certificates, and share what you offer to BRIDGE in minutes.
          </p>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <Link to="/register" className="btn-primary">
                Apply
              </Link>
              <div>
                <Link to="/login" className="btn-link">
                  Login
                </Link>
              </div>
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
