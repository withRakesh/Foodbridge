import { useState } from 'react';
import { createInstitution } from '../api/institutionApi';

const TYPES = [
  { value: 'orphanage', label: 'Orphanage' },
  { value: 'old_age_home', label: 'Old age home' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'other', label: 'Other' },
];

// Lets an NGO pick which institution a donation is going to, right at the
// moment of accepting it. If they haven't added any institutions yet, the
// "add new" mini-form is right here — no separate institutions page to visit.
export default function InstitutionPicker({ institutions, selectedId, onSelect, onCreated }) {
  const [adding, setAdding] = useState(institutions.length === 0);
  const [form, setForm] = useState({ name: '', type: 'orphanage', address: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await createInstitution(form);
      onCreated(data.institution);
      setForm({ name: '', type: 'orphanage', address: '' });
      setAdding(false);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not add institution.');
    } finally {
      setSubmitting(false);
    }
  };

  if (adding || institutions.length === 0) {
    return (
      <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-neutral-200 bg-cream p-4">
        <p className="text-xs font-medium text-neutral-600">
          Which institution is this going to?
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Institution name"
            value={form.name}
            onChange={update('name')}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-1"
          />
          <select
            value={form.type}
            onChange={update('type')}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Address"
            value={form.address}
            onChange={update('address')}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-status-expired">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition hover:bg-accent-light disabled:opacity-60"
          >
            {submitting ? 'Adding\u2026' : 'Save institution'}
          </button>
          {institutions.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="" disabled>
          Select institution{'\u2026'}
        </option>
        {institutions.map((inst) => (
          <option key={inst._id} value={inst._id}>
            {inst.name} — {inst.address}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex-none text-xs font-medium text-primary hover:underline"
      >
        + New
      </button>
    </div>
  );
}
