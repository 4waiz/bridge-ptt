import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import useAuth from '../../context/useAuth';

function SiteLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [{ to: '/', label: 'Home' }];
    }

    if (user.role === 'reviewer') {
      return [
        { to: '/', label: 'Home' },
        { to: '/reviewer', label: 'Reviewer Desk' },
      ];
    }

    return [
      { to: '/', label: 'Home' },
      { to: '/applicant', label: 'Apply' },
    ];
  }, [isAuthenticated, user]);

  const accountPath = isAuthenticated && user ? '/account' : '/login';

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-brandDark/15 bg-white/95 backdrop-blur">
        <div className="container flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex shrink-0 items-center" onClick={closeMenu}>
            <img
              src="/bridge-logo.png"
              alt="BRIDGE logo"
              className="h-12 w-auto max-w-[180px] object-contain sm:h-14 sm:max-w-[240px] lg:h-16 lg:max-w-[320px]"
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `btn ${isActive ? 'bg-brandDark/80 text-white' : 'text-brandDark/80 hover:bg-brandDark/10'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Apply
                </Link>
              </>
            ) : (
              <>
                <Link to={accountPath} className="btn-secondary">
                  Account
                </Link>
                <button type="button" onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn-secondary md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            Menu
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-nav" className="border-t border-brandDark/15 bg-white md:hidden">
            <div className="container space-y-3 py-4">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `btn w-full justify-start ${
                        isActive
                          ? 'bg-brandDark/80 text-white'
                          : 'bg-brandDark/5 text-brandDark/80 hover:bg-brandDark/10'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="grid gap-2">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" onClick={closeMenu} className="btn-primary w-full">
                      Apply
                    </Link>
                    <Link to="/login" onClick={closeMenu} className="btn-secondary w-full">
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to={accountPath} onClick={closeMenu} className="btn-secondary w-full">
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      className="btn-secondary w-full"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container flex-1 py-8 md:py-12">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-brandDark/15 bg-brandDark/80 text-slate-100">
        <div className="container grid gap-6 py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-base font-black">BRIDGE</p>
            <p className="mt-2 max-w-prose text-sm text-slate-300">
              Part-time recruiting portal for applicants and reviewer teams.
            </p>
          </div>

          <div className="text-sm md:text-right">
            <p className="text-slate-300">Made by</p>
            <a
              href="https://awaizahmed.com"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-lg font-bold text-slate-100 underline decoration-brandPrimary underline-offset-4 hover:text-brandPrimary focus-visible:text-brandPrimary"
            >
              Awaiz Ahmed
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SiteLayout;
