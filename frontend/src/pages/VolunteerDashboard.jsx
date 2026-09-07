import { useEffect, useState } from 'react';
import { Bike } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { getMyAssignments, markDelivered } from '../api/donationApi';

function AssignmentCard({ donation, onDelivered }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleMarkDelivered = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await markDelivered(donation._id);
      onDelivered(data.donation);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not mark this as delivered.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          {donation.imageUrl && (
            <img
              src={donation.imageUrl}
              alt={donation.foodName}
              className="h-16 w-16 flex-none rounded-xl object-cover"
            />
          )}
          <div>
            <p className="font-display font-700 text-neutral-900">{donation.foodName}</p>
            <p className="text-sm text-neutral-600">{donation.quantity}</p>
            <p className="mt-1 text-xs text-neutral-600">
              Pickup: {donation.restaurant?.name} — {donation.location?.address}
            </p>
            <p className="text-xs text-neutral-600">Drop-off routed by: {donation.ngo?.name}</p>
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {error && <p className="mt-3 text-xs text-status-expired">{error}</p>}

      {donation.status === 'volunteer_assigned' && (
        <p className="mt-4 text-xs text-neutral-600">
          Waiting on the restaurant to confirm handover — nothing to do here yet.
        </p>
      )}

      {donation.status === 'collected' && (
        <div className="mt-4">
          <button
            onClick={handleMarkDelivered}
            disabled={busy}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {busy ? 'Marking\u2026' : 'Mark delivered'}
          </button>
        </div>
      )}

      {donation.status === 'delivered' && (
        <p className="mt-4 text-xs text-neutral-600">
          Delivered — waiting on the NGO to confirm receipt.
        </p>
      )}
    </li>
  );
}

export default function VolunteerDashboard() {
  const socket = useSocket();
  const { addToast } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getMyAssignments()
      .then((data) => setAssignments(data.donations))
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load your assignments.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Live update: this event is sent straight to this volunteer's own
  // private room, so it only ever fires for assignments that are ours.
  useEffect(() => {
    if (!socket) return;

    const handleNewAssignment = ({ message, donation }) => {
      addToast(message);
      setAssignments((prev) =>
        prev.some((d) => d._id === donation._id) ? prev : [donation, ...prev]
      );
    };

    socket.on('new-assignment', handleNewAssignment);
    return () => socket.off('new-assignment', handleNewAssignment);
  }, [socket, addToast]);

  const updateLocal = (updated) =>
    setAssignments((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-700 text-accent">Volunteer Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Your pickups and deliveries — one tap once food's in your hands, one tap once it's dropped off.
      </p>

      {loading && <div className="mt-6"><SkeletonList count={2} /></div>}
      {error && <p className="mt-6 text-sm text-status-expired">{error}</p>}

      {!loading && !error && assignments.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Bike}
            title="No assignments yet"
            description="An NGO will assign you once they accept a donation — you'll get a notification the moment it happens."
          />
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <ul className="mt-6 space-y-4">
          {assignments.map((donation) => (
            <AssignmentCard key={donation._id} donation={donation} onDelivered={updateLocal} />
          ))}
        </ul>
      )}
    </div>
  );
}
