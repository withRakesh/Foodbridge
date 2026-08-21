import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DASHBOARD_PATH = {
  admin: '/admin',
  restaurant: '/restaurant',
  ngo: '/ngo',
  volunteer: '/volunteer',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const infoMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await login(email, password);
      navigate(DASHBOARD_PATH[data.role] ?? '/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-700 text-accent">Log in</h1>
      <p className="mt-1 text-sm text-neutral-600">Pick up where you left off.</p>

      {infoMessage && (
        <p className="mt-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {infoMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-status-expired">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? 'Logging in\u2026' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        New to FoodBridge?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
