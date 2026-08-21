import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { SkeletonList, SkeletonLine } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import {
  getPendingByRole,
  updateApprovalStatus,
  getAllUsers,
  toggleUserActive,
  getDashboardStats,
  getAllDonationsAdmin,
} from '../api/adminApi';

const TABS = [
  { id: 'approvals', label: 'Pending approvals' },
  { id: 'users', label: 'All users' },
  { id: 'stats', label: 'Stats' },
  { id: 'donations', label: 'Donations' },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
        active ? 'border-primary text-primary' : 'border-transparent text-neutral-600'
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Pending approvals ----------

function PendingUserRow({ user, role, onDecided }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const decide = async (status) => {
    setError(null);
    setBusy(true);
    try {
      await updateApprovalStatus(role, user._id, status);
      onDecided(user._id);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not update this account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-neutral-200 bg-white/60 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-700 text-neutral-900">{user.name}</p>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => decide('approved')}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            Approve
          </button>
          <button
            onClick={() => decide('rejected')}
            disabled={busy}
            className="rounded-full border border-accent px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent hover:text-white disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-status-expired">{error}</p>}
    </li>
  );
}

function PendingApprovalsTab() {
  const [restaurants, setRestaurants] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getPendingByRole('restaurant'), getPendingByRole('ngo')])
      .then(([r, n]) => {
        setRestaurants(r.users);
        setNgos(n.users);
      })
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load pending accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeRestaurant = (id) => setRestaurants((prev) => prev.filter((u) => u._id !== id));
  const removeNgo = (id) => setNgos((prev) => prev.filter((u) => u._id !== id));

  if (loading) {
    return (
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <SkeletonList count={2} />
        <SkeletonList count={2} />
      </div>
    );
  }
  if (error) return <p className="mt-6 text-sm text-status-expired">{error}</p>;

  return (
    <div className="mt-6 grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="font-display font-700 text-neutral-900">Restaurants ({restaurants.length})</h3>
        {restaurants.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={'\u2705'} title="Nothing pending" description="No restaurant signups waiting on you." />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {restaurants.map((u) => (
              <PendingUserRow key={u._id} user={u} role="restaurant" onDecided={removeRestaurant} />
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="font-display font-700 text-neutral-900">NGOs ({ngos.length})</h3>
        {ngos.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={'\u2705'} title="Nothing pending" description="No NGO signups waiting on you." />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {ngos.map((u) => (
              <PendingUserRow key={u._id} user={u} role="ngo" onDecided={removeNgo} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------- All users ----------

function UserRow({ user, onToggled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await toggleUserActive(user._id);
      onToggled(user._id, data.user.isActive);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not update this account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-neutral-200 bg-white/60 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-700 text-neutral-900">
            {user.name} <span className="text-xs font-500 text-neutral-600">— {user.role}</span>
          </p>
          <p className="text-sm text-neutral-600">{user.email}</p>
          {user.approvalStatus && (
            <p className="mt-1 text-xs text-neutral-600">Approval: {user.approvalStatus}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              user.isActive ? 'bg-accent/10 text-accent' : 'bg-status-expired/10 text-status-expired'
            }`}
          >
            {user.isActive ? 'Active' : 'Disabled'}
          </span>
          {user.role !== 'admin' && (
            <button
              onClick={handleToggle}
              disabled={busy}
              className="rounded-full border border-accent px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent hover:text-white disabled:opacity-60"
            >
              {user.isActive ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-status-expired">{error}</p>}
    </li>
  );
}

function AllUsersTab() {
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllUsers(roleFilter || undefined)
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load users.'))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  const handleToggled = (id, isActive) =>
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive } : u)));

  return (
    <div className="mt-6">
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="">All roles</option>
        <option value="restaurant">Restaurant</option>
        <option value="ngo">NGO</option>
        <option value="volunteer">Volunteer</option>
        <option value="admin">Admin</option>
      </select>

      {loading && <div className="mt-4"><SkeletonList count={3} /></div>}
      {error && <p className="mt-4 text-sm text-status-expired">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <div className="mt-4">
          <EmptyState icon={'\ud83d\udc65'} title="No users found" description="Try a different role filter." />
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <ul className="mt-4 space-y-3">
          {users.map((u) => (
            <UserRow key={u._id} user={u} onToggled={handleToggled} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Stats ----------

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-6 animate-pulse space-y-8">
        <div className="rounded-2xl border border-neutral-200 bg-accent/5 p-6 text-center">
          <SkeletonLine className="mx-auto h-9 w-16" />
          <div className="mt-2 flex justify-center">
            <SkeletonLine className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <SkeletonLine className="h-8 w-28 rounded-full" />
          <SkeletonLine className="h-8 w-28 rounded-full" />
          <SkeletonLine className="h-8 w-28 rounded-full" />
        </div>
      </div>
    );
  }
  if (error) return <p className="mt-6 text-sm text-status-expired">{error}</p>;

  return (
    <div className="mt-6 space-y-8">
      <div className="rounded-2xl border border-neutral-200 bg-accent/5 p-6 text-center">
        <p className="font-display text-3xl font-800 text-accent">{stats.totalCompletedDonations}</p>
        <p className="mt-1 text-sm text-neutral-600">Donations completed</p>
      </div>

      <div>
        <h3 className="font-display font-700 text-neutral-900">Donations by status</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {stats.donationsByStatus.map((row) => (
            <div key={row._id} className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/60 px-3 py-1.5">
              <StatusBadge status={row._id} />
              <span className="text-sm font-medium text-neutral-900">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-700 text-neutral-900">Users by role &amp; approval</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {stats.usersByRoleAndStatus.map((row) => (
            <div
              key={`${row._id.role}-${row._id.approvalStatus}`}
              className="rounded-full border border-neutral-200 bg-white/60 px-3 py-1.5 text-sm text-neutral-900"
            >
              {row._id.role} · {row._id.approvalStatus ?? 'n/a'} — <span className="font-medium">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Donations monitoring ----------

function DonationsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllDonationsAdmin(statusFilter ? { status: statusFilter } : {})
      .then((data) => setDonations(data.donations))
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load donations.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="mt-6">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="">All statuses</option>
        {['posted', 'accepted', 'volunteer_assigned', 'collected', 'delivered', 'completed', 'cancelled', 'expired'].map(
          (s) => (
            <option key={s} value={s}>
              {s}
            </option>
          )
        )}
      </select>

      {loading && <div className="mt-4"><SkeletonList count={3} /></div>}
      {error && <p className="mt-4 text-sm text-status-expired">{error}</p>}

      {!loading && !error && donations.length === 0 && (
        <div className="mt-4">
          <EmptyState icon={'\ud83d\udcca'} title="No donations found" description="Try a different status filter." />
        </div>
      )}

      {!loading && !error && donations.length > 0 && (
        <ul className="mt-4 space-y-3">
          {donations.map((d) => (
            <li key={d._id} className="rounded-xl border border-neutral-200 bg-white/60 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-700 text-neutral-900">{d.foodName}</p>
                  <p className="text-xs text-neutral-600">
                    {d.restaurant?.name} → {d.ngo?.name ?? '—'} → {d.volunteer?.name ?? '—'}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Main ----------

export default function AdminDashboard() {
  const [tab, setTab] = useState('approvals');

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-2xl font-700 text-accent">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">Approve accounts, monitor donations, keep an eye on the platform.</p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {tab === 'approvals' && <PendingApprovalsTab />}
      {tab === 'users' && <AllUsersTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'donations' && <DonationsTab />}
    </div>
  );
}
