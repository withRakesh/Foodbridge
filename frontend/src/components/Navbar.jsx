import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-neutral-200 bg-cream/90 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeMenu} className="font-display text-xl font-700 text-accent">
            <img
              src="https://res.cloudinary.com/izq5hlmv/image/upload/v1787551106/foodbridge-logo-red-horizontal.png"
              className="h-7 w-auto sm:h-8"
              alt="FoodBridge"
            />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          {isAuthenticated ? (
            <div className="hidden items-center gap-4 md:flex">
              <Link
                to={DASHBOARD_PATH[user.role] ?? '/'}
                className="text-sm font-medium text-neutral-900 hover:text-primary"
              >
                Dashboard
              </Link>
              <NotificationToggle />
              <span className="text-sm text-neutral-600">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
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

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="text-neutral-900 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {menuOpen && (
          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 md:hidden">
            {isAuthenticated ? (
              <>
                <Link
                  to={DASHBOARD_PATH[user.role] ?? '/'}
                  onClick={closeMenu}
                  className="text-sm font-medium text-neutral-900"
                >
                  Dashboard
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{user.name}</span>
                  <NotificationToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="text-sm font-medium text-neutral-900">
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-full bg-primary px-4 py-1.5 text-center text-sm font-medium text-white transition hover:bg-primary-dark"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}