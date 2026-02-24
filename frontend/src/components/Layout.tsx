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
    <div className="min-h-screen bg-base-200">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          {/* Hamburger Dropdown Menu */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-lg bg-base-100 rounded-box w-52">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={isActive(item.path) ? 'active' : ''}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <Link to="/" className="btn btn-ghost normal-case text-xl ml-2">
            🍺 Alcohol Tracker
          </Link>
        </div>
        
        {/* User Avatar - Right Side */}
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

      {/* Page Content */}
      <main className="container mx-auto p-4 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
