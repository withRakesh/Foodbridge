import { Link } from 'react-router-dom';

const CHAIN = [
  { label: 'Posted', who: 'Restaurant' },
  { label: 'Accepted', who: 'NGO' },
  { label: 'Assigned', who: 'Volunteer' },
  { label: 'Collected', who: 'Volunteer' },
  { label: 'Delivered', who: 'Institution' },
  { label: 'Completed', who: 'NGO confirms' },
];

const ROLES = [
  {
    title: 'Restaurants',
    body: 'Post surplus food in seconds — name, quantity, and how long it stays good. Confirm handover the moment a volunteer arrives.',
  },
  {
    title: 'NGOs',
    body: 'See new donations the instant they post. Accept, pick a beneficiary institution, and assign a volunteer — all before the food cools.',
  },
  {
    title: 'Volunteers',
    body: 'Get notified the moment you\u2019re assigned. One tap to mark a pickup collected, one tap to mark it delivered.',
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="mb-4 font-display text-sm font-600 uppercase tracking-widest text-primary">
              Before it spoils
            </p>
            <h1 className="font-display text-4xl font-800 leading-tight text-accent md:text-5xl">
              Surplus food, moved while it still matters.
            </h1>
            <p className="mt-6 max-w-md text-lg text-neutral-600">
              FoodBridge replaces the phone-call-and-WhatsApp scramble with one
              tracked chain from restaurant to shelter — every handoff logged,
              every step notified in real time.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/register"
                className="rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-dark"
              >
                Join FoodBridge
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-accent px-6 py-3 font-medium text-accent transition hover:bg-accent hover:text-white"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Signature element: the donation chain, rendered as the actual
              state machine the product runs on — not a generic stat block. */}
          <div className="rounded-3xl border border-neutral-200 bg-white/60 p-8">
            <p className="mb-6 font-display text-xs font-600 uppercase tracking-widest text-neutral-600">
              One donation, start to finish
            </p>
            <ol className="space-y-0">
              {CHAIN.map((step, i) => (
                <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < CHAIN.length - 1 && (
                    <span
                      className="absolute left-[11px] top-6 h-full w-px"
                      style={{ backgroundColor: 'var(--color-neutral-200)' }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-[11px] font-700 text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-sm font-700 text-neutral-900">{step.label}</p>
                    <p className="text-sm text-neutral-600">{step.who}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-neutral-200 bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-700 text-accent">Built around three people, one handoff</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {ROLES.map((role) => (
              <div key={role.title} className="rounded-2xl border border-neutral-200 bg-cream p-6">
                <h3 className="font-display text-lg font-700 text-neutral-900">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{role.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
