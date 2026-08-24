import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationToggle from './NotificationToggle';

const DASHBOARD_PATH = {
  admin: '/admin',
  restaurant: '/restaurant',
  ngo: '/ngo',
  volunteer: '/volunteer',
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-neutral-200 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-4 sm:px-6">
         <Link to="/" className="font-display text-xl font-700 text-accent">
          <img
            src="https://res.cloudinary.com/izq5hlmv/image/upload/v1787551106/foodbridge-logo-red-horizontal.png"
            className="h-7 w-auto sm:h-8"
            alt="FoodBridge"
          />
        </Link>

        {isAuthenticated ? (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to={DASHBOARD_PATH[user.role] ?? '/'}
              className="text-sm font-medium text-neutral-900 hover:text-primary"
            >
              Dashboard
            </Link>
            <NotificationToggle />
            <span className="hidden text-sm text-neutral-600 sm:inline">{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-neutral-900 hover:text-primary">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              Get started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
