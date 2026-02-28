import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from './Button';
import { tr } from '../i18n/tr';

type LayoutProps = {
  children?: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const pageTitleMap: Record<string, string> = {
    '/': tr.layout.pageTitleDashboard(),
    '/drinks': tr.layout.pageTitleDrinks(),
    '/calendar': tr.layout.pageTitleCalendar(),
    '/stats': tr.layout.pageTitleStats(),
    '/settings': tr.layout.pageTitleSettings(),
    '/translations': tr.layout.pageTitleTranslations(),
    '/users': tr.layout.pageTitleUsers(),
    '/audit-logs': tr.layout.pageTitleAuditLogs(),
  };

  const pageTitle = pageTitleMap[location.pathname] || 'Dashboard';

  const menuItems = [
    { path: '/', label: tr.layout.menuDashboard() },
    { path: '/drinks', label: tr.layout.menuDrinks() },
    { path: '/calendar', label: tr.layout.menuCalendar() },
    { path: '/stats', label: tr.layout.menuStats() },
    { path: '/settings', label: tr.layout.menuSettings() },
    ...(user?.role === 'admin'
      ? [
          { path: '/translations', label: tr.layout.menuTranslations() },
          { path: '/users', label: tr.layout.menuUsers() },
          { path: '/audit-logs', label: tr.layout.menuAuditLogs() },
        ]
      : []),
  ];

  return (
    <div className="drawer min-h-screen bg-base-100">
      <input id="layout-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">
        <header className="fixed top-0 left-0 right-0 z-[60] h-[60px] bg-base-200 border-b border-base-300">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="w-1/3 flex items-center">
              <label htmlFor="layout-drawer" className="btn btn-ghost btn-square drawer-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
            </div>

            <div className="w-1/3 text-center font-semibold truncate">{pageTitle}</div>

            <div className="w-1/3 text-right truncate">{user?.email || tr.layout.userFallback()}</div>
          </div>
        </header>

        <main className="pt-[60px] p-4">
          <div className="mx-auto w-full max-w-5xl">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="layout-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="w-72 min-h-full bg-base-200 pt-[60px]">
          <ul className="menu p-4 gap-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className={isActive(item.path) ? 'active' : ''}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Button type="button" variant="outline" onClick={logout} className="w-full justify-start border-0 shadow-none">
                {tr.layout.menuLogout()}
              </Button>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
