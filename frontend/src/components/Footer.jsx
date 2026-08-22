export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-accent">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center">
        <p className="font-display text-sm font-700 text-white/50">FoodBridge</p>
        <p className="mt-1 text-xs text-white/50">
          Surplus food, moved before it's too late.
        </p>
        <p className="mt-3 text-xs text-white/50">
          &copy; {new Date().getFullYear()} FoodBridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
