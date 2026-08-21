// Pulsing placeholder shapes shown while data loads, instead of a bare
// "Loading…" line. Matches the rounded-2xl card shape used across every
// dashboard's list items, so the layout doesn't jump once real data
// arrives.

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-16 w-16 flex-none rounded-xl bg-neutral-200" />
          <div className="space-y-2 py-1">
            <div className="h-4 w-32 rounded bg-neutral-200" />
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-3 w-40 rounded bg-neutral-200" />
          </div>
        </div>
        <div className="h-6 w-20 flex-none rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}

// Renders `count` SkeletonCards stacked the same way a real donation/user
// list would be — drop this in wherever a list is loading.
export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// A smaller pulsing line, for places a full card skeleton is too heavy
// (e.g. the Stats tab's number tiles).
export function SkeletonLine({ className = 'h-4 w-32' }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}
