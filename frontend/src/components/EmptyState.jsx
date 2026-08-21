// A consistent "nothing here yet" block, used anywhere a list can be
// legitimately empty (no donations, no institutions, no pending
// approvals). Keeps every dashboard's empty state visually the same
// instead of each one improvising its own gray line of text.
export default function EmptyState({ icon = '\ud83c\udf7d\ufe0f', title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-10 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 font-display font-700 text-neutral-900">{title}</p>
      {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
    </div>
  );
}
