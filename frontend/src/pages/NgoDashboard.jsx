import { useEffect, useState } from 'react';
import { MapPin, Clock, UtensilsCrossed, Package, ClipboardList, Building2, Bike } from 'lucide-react';
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

// Returns a color class based on how soon the donation expires — this is
// the app's core value prop ("before it's too late"), so the UI should
// actually signal urgency instead of showing a flat neutral timestamp.
function getUrgencyStyle(expiryTime) {
  if (!expiryTime) return { text: 'text-neutral-600', dot: 'bg-neutral-400' };
  const hoursLeft = (new Date(expiryTime) - new Date()) / (1000 * 60 * 60);
  if (hoursLeft <= 2) return { text: 'text-status-expired font-medium', dot: 'bg-status-expired' };
  if (hoursLeft <= 6) return { text: 'text-status-collected font-medium', dot: 'bg-status-collected' };
  return { text: 'text-neutral-600', dot: 'bg-accent-light' };
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

  const urgency = getUrgencyStyle(donation.expiryTime);

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex gap-3 sm:gap-4">
          {donation.imageUrl ? (
            <img
              src={donation.imageUrl}
              alt={donation.foodName}
              className="h-14 w-14 flex-none rounded-xl object-cover sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-primary/10 sm:h-16 sm:w-16">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display font-700 text-neutral-900">{donation.foodName}</p>
            <p className="text-sm text-neutral-600">
              {donation.quantity} · {donation.restaurant?.name}
            </p>
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3">
        {donation.location?.address && (
          <p className="flex items-start gap-1.5 text-xs text-neutral-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" strokeWidth={2} />
            <span className="min-w-0 truncate">{donation.location.address}</span>
          </p>
        )}
        {donation.expiryTime && (
          <p className={`flex items-center gap-1.5 text-xs ${urgency.text}`}>
            <Clock className="h-3.5 w-3.5 flex-none" strokeWidth={2} />
            Good until {formatExpiry(donation.expiryTime)}
            <span className={`h-1.5 w-1.5 flex-none rounded-full ${urgency.dot}`} />
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3 rounded-xl bg-cream/60 p-3">
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
          className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
        >
          {accepting ? 'Accepting\u2026' : 'Accept donation'}
        </button>
      </div>
    </li>
  );
}

// Small "nothing to do yet, here's what's happening" line for statuses
// that don't have an NGO-side action — keeps the card from looking dead
// while it's just waiting on someone else's step.
function waitingMessage(status) {
  if (status === 'volunteer_assigned') return 'Waiting on the restaurant to hand it over.';
  if (status === 'collected') return 'On the way — waiting on the volunteer to mark it delivered.';
  return null;
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

  const waiting = waitingMessage(donation.status);

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white/60 p-4 sm:p-5">
      {/* Header: image + name/quantity, badge below on mobile so long
          text never fights the badge for horizontal space */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex gap-3 sm:gap-4">
          {donation.imageUrl ? (
            <img
              src={donation.imageUrl}
              alt={donation.foodName}
              className="h-14 w-14 flex-none rounded-xl object-cover sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-primary/10 sm:h-16 sm:w-16">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          )}
          {/* min-w-0 lets long food names truncate instead of forcing the
              card wider than its container. Name + quantity share a row
              via flex (not a fixed grid), so a short quantity like "5kg"
              doesn't leave an odd empty gap next to a long food name. */}
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-display font-700 text-neutral-900">{donation.foodName}</p>
              <p className="flex-none text-sm text-neutral-600">{donation.quantity}</p>
            </div>
            <p className="text-sm text-neutral-600">From {donation.restaurant?.name}</p>
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {/* Metadata row — icons make destination/volunteer scannable at a
          glance, matching AvailableDonationCard's address/expiry row */}
      <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3">
        <p className="flex items-start gap-1.5 text-xs text-neutral-600">
          <Building2 className="mt-0.5 h-3.5 w-3.5 flex-none" strokeWidth={2} />
          <span className="min-w-0 truncate">
            {donation.institution?.name ?? 'No institution recorded'}
          </span>
        </p>
        {donation.volunteer?.name && (
          <p className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Bike className="h-3.5 w-3.5 flex-none" strokeWidth={2} />
            {donation.volunteer.name}
          </p>
        )}
      </div>

      {waiting && <p className="mt-3 text-xs text-neutral-600">{waiting}</p>}

      {donation.status === 'accepted' && (
        <div className="mt-4 space-y-3 rounded-xl bg-cream/60 p-3">
          {volunteers.length === 0 ? (
            <p className="text-xs text-neutral-600">
              No volunteers are currently available — check back once one is free.
            </p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:flex-1 sm:py-2"
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
                className="w-full flex-none rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto sm:py-2"
              >
                {assigning ? 'Assigning\u2026' : 'Assign'}
              </button>
            </div>
          )}
          {error && <p className="text-xs text-status-expired">{error}</p>}
        </div>
      )}

      {donation.status === 'delivered' && (
        <div className="mt-4 space-y-2 rounded-xl bg-cream/60 p-3">
          <button
            onClick={handleConfirmDelivery}
            disabled={confirming}
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
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
    setAvailable((prev) => prev.filter((d) => d._id !== donationId));
    getMyNgoDonations()
      .then((data) => setMine(data.donations))
      .catch(() => {});
  };

  const handleInstitutionsChanged = (newInstitution) => {
    setInstitutions((prev) => [newInstitution, ...prev]);
  };

  const handleAssigned = (donationId, volunteerId) => {
    setVolunteers((prev) => prev.filter((v) => v._id !== volunteerId));
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

      {loading && (
        <div className="mt-6">
          <SkeletonList count={3} />
        </div>
      )}
      {error && <p className="mt-6 text-sm text-status-expired">{error}</p>}

      {!loading &&
        !error &&
        tab === 'available' &&
        (available.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Package}
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
        ))}

      {!loading &&
        !error &&
        tab === 'mine' &&
        (mine.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ClipboardList}
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
        ))}
    </div>
  );
}
