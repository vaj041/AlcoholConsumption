import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/drinks', label: 'Drinks', icon: '🍺' },
    { path: '/history', label: 'History', icon: '📜' },
    { path: '/stats', label: 'Statistics', icon: '📈' },
  ];

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-screen bg-base-200 flex flex-col">
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-lg">
          <div className="flex-1 gap-2">
            <label htmlFor="main-drawer" className="btn btn-square btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
            <Link to="/" className="btn btn-ghost normal-case text-xl">
              🍺 Alcohol Tracker
            </Link>
            
            {/* Desktop menu */}
            <ul className="menu menu-horizontal px-2 hidden lg:flex">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={isActive(item.path) ? 'active' : ''}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User menu - always on the right */}
          <div className="flex-none">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-primary text-primary-content w-10 rounded-full">
                  <span className="text-lg">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-300">
                <li className="menu-title px-4 py-2">
                  <span className="text-xs">{user?.email}</span>
                </li>
                <li><button onClick={logout}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 container mx-auto p-4 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>

      {/* Sidebar drawer for mobile */}
      <div className="drawer-side z-40">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu bg-base-100 min-h-full w-80 p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold px-4 py-2">🍺 Menu</h2>
          </div>
          <ul className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`text-base py-3 ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => {
                    const drawer = document.getElementById('main-drawer') as HTMLInputElement;
                    if (drawer) drawer.checked = false;
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-4 border-t border-base-300">
            <div className="px-4 py-3 mb-3 bg-base-200 rounded-lg">
              <p className="text-xs text-base-content/60 mb-1">Signed in as</p>
              <p className="font-semibold text-sm truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => {
                logout();
                const drawer = document.getElementById('main-drawer') as HTMLInputElement;
                if (drawer) drawer.checked = false;
              }}
              className="btn btn-error btn-block"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
