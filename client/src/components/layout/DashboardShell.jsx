import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import useAuth from '/useAuth';

const navigationByRole = {
  applicant: [{ to: '/applicant', label: 'Application' }],
  reviewer: [{ to: '/reviewer', label: 'Review Board' }],
  admin: [{ to: '/admin', label: 'Admin Console' }],
};

function DashboardShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navItems = navigationByRole[user?.role] || [];

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <aside className="card-surface md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-64 md:shrink-0">
          <div className="flex h-full flex-col p-4">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recruiting Campaign</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">Bridge ATS</h1>
            </div>

            <nav className="flex gap-2 overflow-x-auto md:flex-col">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-xl px-3 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p>
            </div>

            <button type="button" onClick={logout} className="btn-secondary mt-auto w-full">
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="mb-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-6 text-white shadow-glow">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-200">{subtitle}</p>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
