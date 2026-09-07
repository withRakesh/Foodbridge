import { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import DateTimePicker from '../components/DateTimePicker';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { createDonation, getMyDonations, cancelDonation, confirmHandover } from '../api/donationApi';

const EMPTY_FORM = {
  foodName: '',
  quantity: '',
  preparedTime: '',
  expiryTime: '',
  address: '',
  lat: '',
  lng: '',
};

function PostDonationForm({ onPosted }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setError('Could not get your location — enter it manually below.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // DateTimePicker already hands back full ISO strings (or '').
    const preparedIso = form.preparedTime || null;
    const expiryIso = form.expiryTime || null;

    if (!preparedIso || !expiryIso) {
      setError('Enter valid prepared and expiry times.');
      return;
    }
    if (new Date(expiryIso) <= new Date(preparedIso)) {
      setError('Expiry time must be after prepared time.');
      return;
    }
    if (new Date(expiryIso) <= new Date()) {
      setError('Expiry time must be in the future.');
      return;
    }
    if (form.lat === '' || form.lng === '') {
      setError('Pickup location needs a latitude and longitude — use "Use my location" or enter manually.');
      return;
    }

    const fd = new FormData();
    fd.append('foodName', form.foodName);
    fd.append('quantity', form.quantity);
    fd.append('preparedTime', preparedIso);
    fd.append('expiryTime', expiryIso);
    fd.append(
      'location',
      JSON.stringify({ address: form.address, lat: Number(form.lat), lng: Number(form.lng) })
    );
    if (imageFile) fd.append('image', imageFile);

    setSubmitting(true);
    try {
      const data = await createDonation(fd);
      onPosted(data.donation);
      setForm(EMPTY_FORM);
      setImageFile(null);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not post this donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white/60 p-6">
      <h2 className="font-display text-lg font-700 text-neutral-900">Post surplus food</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="foodName" className="block text-sm font-medium text-neutral-900">
            Food name
          </label>
          <input
            id="foodName"
            required
            value={form.foodName}
            onChange={update('foodName')}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Vegetable Biryani"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-neutral-900">
            Quantity
          </label>
          <input
            id="quantity"
            required
            value={form.quantity}
            onChange={update('quantity')}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="10 kg"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 ">
        <DateTimePicker
          label="Prepared at"
          value={form.preparedTime}
          onChange={(iso) => setForm((f) => ({ ...f, preparedTime: iso }))}
        />
        <DateTimePicker
          label="Good until"
          value={form.expiryTime}
          onChange={(iso) => setForm((f) => ({ ...f, expiryTime: iso }))}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="address" className="block text-sm font-medium text-neutral-900">
            Pickup address
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
          >
            {locating ? 'Locating\u2026' : 'Use my location'}
          </button>
        </div>
        <input
          id="address"
          required
          value={form.address}
          onChange={update('address')}
          className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="12 Anna Salai, Chennai"
        />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            step="any"
            value={form.lat}
            onChange={update('lat')}
            placeholder="Latitude"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            required
            type="number"
            step="any"
            value={form.lng}
            onChange={update('lng')}
            placeholder="Longitude"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-neutral-900">
          Photo <span className="text-neutral-600">(optional)</span>
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1.5 w-full text-sm text-neutral-600"
        />
      </div>

      {error && <p className="text-sm text-status-expired">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting ? 'Posting\u2026' : 'Post donation'}
      </button>
    </form>
  );
}

function DonationCard({ donation, onCancelled, onHandoverConfirmed }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleCancel = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await cancelDonation(donation._id);
      onCancelled(data.donation);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not cancel.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmHandover = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await confirmHandover(donation._id);
      onHandoverConfirmed(data.donation);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not confirm handover.');
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
            <p className="text-xs text-neutral-600">{donation.location?.address}</p>
            {donation.ngo?.name && (
              <p className="mt-1 text-xs text-neutral-600">Accepted by: {donation.ngo.name}</p>
            )}
            {donation.volunteer?.name && (
              <p className="text-xs text-neutral-600">Volunteer: {donation.volunteer.name}</p>
            )}
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {error && <p className="mt-3 text-xs text-status-expired">{error}</p>}

      <div className="mt-4 flex gap-3">
        {donation.status === 'posted' && (
          <button
            onClick={handleCancel}
            disabled={busy}
            className="rounded-full border border-accent px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        {donation.status === 'volunteer_assigned' && (
          <button
            onClick={handleConfirmHandover}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {busy ? 'Confirming\u2026' : 'Confirm handover'}
          </button>
        )}
      </div>
    </li>
  );
}

export default function RestaurantDashboard() {
  const socket = useSocket();
  const { addToast } = useToast();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getMyDonations()
      .then((data) => setDonations(data.donations))
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load your donations.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateLocal = (updated) =>
    setDonations((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));

  // Live updates: an NGO accepting your donation, or the NGO confirming
  // final delivery, both update this list in place — both events are
  // sent straight to this restaurant's own private room server-side, so
  // everything received here is already relevant.
  useEffect(() => {
    if (!socket) return;

    const handleDonationAccepted = ({ message, donation }) => {
      addToast(message);
      updateLocal(donation);
    };

    const handleDonationCompleted = ({ message, donation }) => {
      addToast(message);
      updateLocal(donation);
    };

    socket.on('donation-accepted', handleDonationAccepted);
    socket.on('donation-completed', handleDonationCompleted);

    return () => {
      socket.off('donation-accepted', handleDonationAccepted);
      socket.off('donation-completed', handleDonationCompleted);
    };
  }, [socket, addToast]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-700 text-accent">Restaurant Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Post surplus food and confirm handover the moment a volunteer arrives.
      </p>

      <div className="mt-8">
        <PostDonationForm onPosted={(d) => setDonations((prev) => [d, ...prev])} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-700 text-neutral-900">
          Your donations {!loading && `(${donations.length})`}
        </h2>

        {loading && <div className="mt-4"><SkeletonList count={2} /></div>}
        {error && <p className="mt-3 text-sm text-status-expired">{error}</p>}

        {!loading && !error && donations.length === 0 && (
          <div className="mt-4">
            <EmptyState
              icon={UtensilsCrossed}
              title="Nothing posted yet"
              description="Use the form above to post your first surplus donation."
            />
          </div>
        )}

        {!loading && donations.length > 0 && (
          <ul className="mt-4 space-y-4">
            {donations.map((donation) => (
              <DonationCard
                key={donation._id}
                donation={donation}
                onCancelled={updateLocal}
                onHandoverConfirmed={updateLocal}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
