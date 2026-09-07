import { UtensilsCrossed } from 'lucide-react';

// A consistent "nothing here yet" block, used anywhere a list can be
// legitimately empty (no donations, no institutions, no pending
// approvals). Keeps every dashboard's empty state visually the same
// instead of each one improvising its own gray line of text.
//
// `icon` takes a lucide-react component (not an instance) — e.g.
// icon={Package} — so this component controls the size/color/stroke
// consistently, instead of every call site styling its own icon.
export default function EmptyState({ icon: Icon = UtensilsCrossed, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-neutral-600" strokeWidth={1.5} />
      <p className="mt-3 font-display font-700 text-neutral-900">{title}</p>
      {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
    </div>
  );
}
