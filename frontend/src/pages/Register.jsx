import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'restaurant', label: 'Restaurant', hint: 'Post surplus food for pickup' },
  { value: 'ngo', label: 'NGO', hint: 'Accept donations for your institutions' },
  { value: 'volunteer', label: 'Volunteer', hint: 'Collect and deliver food' },
];

// Roles that need admin approval before they can log in — matches the
// User model's approvalStatus default (admin/volunteer start 'approved',
// restaurant/ngo start 'pending').
const NEEDS_APPROVAL = new Set(['restaurant', 'ngo']);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'restaurant' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      const message = NEEDS_APPROVAL.has(form.role)
        ? "Account created. An admin needs to approve it before you can log in — we'll be quick."
        : 'Account created. You can log in now.';
      navigate('/login', { state: { message } });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-700 text-accent">Create an account</h1>
      <p className="mt-1 text-sm text-neutral-600">Join as the role that fits what you do.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <fieldset>
          <legend className="block text-sm font-medium text-neutral-900">I am a{'\u2026'}</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition ${
                  form.role === r.value
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={update('role')}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            {ROLES.find((r) => r.value === form.role)?.hint}
          </p>
        </fieldset>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={update('name')}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
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
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-neutral-600">At least 6 characters.</p>
        </div>

        {error && <p className="text-sm text-status-expired">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? 'Creating account\u2026' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
