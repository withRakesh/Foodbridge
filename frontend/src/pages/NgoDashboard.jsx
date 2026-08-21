import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import InstitutionPicker from '../components/InstitutionPicker';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { getMyInstitutions } from '../api/institutionApi';
import { getAvailableVolunteers } from '../api/volunteerApi';
import {
  getAvailableDonations,
  getMyNgoDonations,
  acceptDonation,
  assignVolunteer,
  confirmDelivery,
} from '../api/donationApi';

function formatExpiry(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function AvailableDonationCard({ donation, institutions, onInstitutionsChanged, onAccepted }) {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    if (!selectedInstitutionId) {
      setError('Pick (or add) an institution first.');
      return;
    }
    setError(null);
    setAccepting(true);
    try {
      await acceptDonation(donation._id, selectedInstitutionId);
      onAccepted(donation._id);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not accept this donation.');
    } finally {
      setAccepting(false);
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
            <p className="text-sm text-neutral-600">
              {donation.quantity} · {donation.restaurant?.name}
            </p>
            <p className="text-xs text-neutral-600">{donation.location?.address}</p>
            {donation.expiryTime && (
              <p className="mt-1 text-xs text-neutral-600">Good until {formatExpiry(donation.expiryTime)}</p>
            )}
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      <div className="mt-4 space-y-3">
        <InstitutionPicker
          institutions={institutions}
          selectedId={selectedInstitutionId}
          onSelect={setSelectedInstitutionId}
          onCreated={(inst) => {
            onInstitutionsChanged(inst);
            setSelectedInstitutionId(inst._id);
          }}
        />

        {error && <p className="text-xs text-status-expired">{error}</p>}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {accepting ? 'Accepting\u2026' : 'Accept donation'}
        </button>
      </div>
    </li>
  );
}

function MyDonationCard({ donation, volunteers, onAssigned, onDeliveryConfirmed }) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const handleAssign = async () => {
    if (!selectedVolunteerId) {
      setError('Pick a volunteer first.');
      return;
    }
    setError(null);
    setAssigning(true);
    try {
      await assignVolunteer(donation._id, selectedVolunteerId);
      onAssigned(donation._id, selectedVolunteerId);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not assign a volunteer.');
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setError(null);
    setConfirming(true);
    try {
      const data = await confirmDelivery(donation._id);
      onDeliveryConfirmed(data.donation);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not confirm delivery.');
    } finally {
      setConfirming(false);
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
            <p className="text-sm text-neutral-600">
              {donation.quantity} · {donation.restaurant?.name}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              → {donation.institution?.name ?? 'No institution recorded'}
            </p>
            {donation.volunteer?.name && (
              <p className="text-xs text-neutral-600">Volunteer: {donation.volunteer.name}</p>
            )}
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {donation.status === 'accepted' && (
        <div className="mt-4 space-y-2">
          {volunteers.length === 0 ? (
            <p className="text-xs text-neutral-600">
              No volunteers are currently available — check back once one is free.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select volunteer{'\u2026'}
                </option>
                {volunteers.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-none rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {assigning ? 'Assigning\u2026' : 'Assign'}
              </button>
            </div>
          )}
          {error && <p className="text-xs text-status-expired">{error}</p>}
        </div>
      )}

      {donation.status === 'delivered' && (
        <div className="mt-4 space-y-2">
          <button
            onClick={handleConfirmDelivery}
            disabled={confirming}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {confirming ? 'Confirming\u2026' : 'Confirm delivery'}
          </button>
          {error && <p className="text-xs text-status-expired">{error}</p>}
        </div>
      )}
    </li>
  );
}

export default function NgoDashboard() {
  const socket = useSocket();
  const { addToast } = useToast();

  const [tab, setTab] = useState('available');

  const [institutions, setInstitutions] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getMyInstitutions(),
      getAvailableVolunteers(),
      getAvailableDonations(),
      getMyNgoDonations(),
    ])
      .then(([instData, volData, availData, mineData]) => {
        setInstitutions(instData.institutions);
        setVolunteers(volData.volunteers);
        setAvailable(availData.donations);
        setMine(mineData.donations);
      })
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  // Live updates: a new donation posted anywhere shows up in "Available"
  // without a refresh, and a volunteer marking something delivered updates
  // "My donations" the same way. Both events are room-targeted server-side
  // (role:ngo / this NGO's own room), so every event received here is
  // already relevant — no filtering needed.
  useEffect(() => {
    if (!socket) return;

    const handleNewDonation = ({ message, donation }) => {
      addToast(message);
      setAvailable((prev) => [donation, ...prev]);
    };

    const handleDonationDelivered = ({ message, donation }) => {
      addToast(message);
      setMine((prev) => prev.map((d) => (d._id === donation._id ? donation : d)));
    };

    socket.on('new-donation', handleNewDonation);
    socket.on('donation-delivered', handleDonationDelivered);

    return () => {
      socket.off('new-donation', handleNewDonation);
      socket.off('donation-delivered', handleDonationDelivered);
    };
  }, [socket, addToast]);

  const handleAccepted = (donationId) => {
    // Move it out of "available" locally, then refetch "mine" so it shows
    // up there with the real populated institution/status from the server.
    setAvailable((prev) => prev.filter((d) => d._id !== donationId));
    getMyNgoDonations()
      .then((data) => setMine(data.donations))
      .catch(() => {});
  };

  const handleInstitutionsChanged = (newInstitution) => {
    setInstitutions((prev) => [newInstitution, ...prev]);
  };

  const handleAssigned = (donationId, volunteerId) => {
    // The assigned volunteer is no longer available for other donations.
    setVolunteers((prev) => prev.filter((v) => v._id !== volunteerId));
    // Refetch "mine" so the card picks up status 'volunteer_assigned' and
    // the populated volunteer name from the server.
    getMyNgoDonations()
      .then((data) => setMine(data.donations))
      .catch(() => {});
  };

  const handleDeliveryConfirmed = (updated) =>
    setMine((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-2xl font-700 text-accent">NGO Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Accept surplus food and route it to the right place — pick or add an institution right when
        you accept.
      </p>

      <div className="mt-6 flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setTab('available')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
            tab === 'available' ? 'border-primary text-primary' : 'border-transparent text-neutral-600'
          }`}
        >
          Available ({available.length})
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
            tab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-neutral-600'
          }`}
        >
          My donations ({mine.length})
        </button>
      </div>

      {loading && <div className="mt-6"><SkeletonList count={3} /></div>}
      {error && <p className="mt-6 text-sm text-status-expired">{error}</p>}

      {!loading && !error && tab === 'available' && (
        available.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={'\ud83d\udce6'}
              title="No donations posted right now"
              description="Check back soon — you'll get a live notification the moment one comes in."
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {available.map((donation) => (
              <AvailableDonationCard
                key={donation._id}
                donation={donation}
                institutions={institutions}
                onInstitutionsChanged={handleInstitutionsChanged}
                onAccepted={handleAccepted}
              />
            ))}
          </ul>
        )
      )}

      {!loading && !error && tab === 'mine' && (
        mine.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={'\ud83d\udccb'}
              title="Nothing accepted yet"
              description="Switch to the Available tab to accept your first donation."
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {mine.map((donation) => (
              <MyDonationCard
                key={donation._id}
                donation={donation}
                volunteers={volunteers}
                onAssigned={handleAssigned}
                onDeliveryConfirmed={handleDeliveryConfirmed}
              />
            ))}
          </ul>
        )
      )}
    </div>
  );
}
