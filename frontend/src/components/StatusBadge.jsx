// Reusable across every donation-list UI (Restaurant/NGO/Volunteer/Admin
// dashboards) — do not write new status-display logic per page, per the
// handover doc's convention.

const STATUS_CONFIG = {
  posted: { label: 'Posted', color: 'var(--color-status-posted)' },
  accepted: { label: 'Accepted', color: 'var(--color-status-accepted)' },
  volunteer_assigned: { label: 'Volunteer assigned', color: 'var(--color-status-assigned)' },
  collected: { label: 'Collected', color: 'var(--color-status-collected)' },
  delivered: { label: 'Delivered', color: 'var(--color-status-delivered)' },
  completed: { label: 'Completed', color: 'var(--color-status-completed)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-status-cancelled)' },
  expired: { label: 'Expired', color: 'var(--color-status-expired)' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'var(--color-neutral-600)' };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-center text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.label}
    </span>
  );
}
  