# FoodBridge Frontend

Built against the verified backend, following the doc's locked-in
conventions (Tailwind v4 `@theme`, Context API only, custom
`DateTimePicker`, Culinary Essentials palette, atomic accept/assign, etc).

## Setup

```
npm install
cp .env.example .env   # defaults already match the backend's .env
npm run dev
```

Backend must be running on `:5000` (its own `.env` already sets
`FRONTEND_URL=http://localhost:5173`, so CORS is pre-wired for this).

## Status: all four roles fully working, tested end-to-end

Restaurant posts (photo, AM/PM times) → NGO accepts (inline institution
create) → NGO assigns a volunteer → Restaurant confirms handover →
Volunteer marks delivered → NGO confirms delivery → `completed`. Admin
can approve pending accounts, manage users, and monitor donations — all
in-app now, no Postman required for any of it.

## What's built

- Vite + React + Tailwind v4 (`@theme` tokens in `src/index.css` —
  palette, fonts, per-status colors; no `tailwind.config.js`)
- `AuthContext` — session restore via `/auth/me`, login/register/logout
- `SocketContext` + `ToastContext` — one live Socket.io connection per
  session (JWT in `auth.token`), toast notifications for live events
- Web Push (`NotificationToggle.jsx`, `public/sw.js`) — opt-in, works
  even with the tab closed. **Needs the separate backend patch** — see
  below if not already applied.
- `axiosInstance` with a JWT request interceptor, and a response
  interceptor that catches an expired/invalid token (401) **or an admin
  disabling this account mid-session** (403, matching the exact message
  your `authMiddleware` sends for that case — not every 403, since
  role-mismatch errors are also 403 and should stay as normal permission
  errors, not force a logout). Either one clears the session and redirects
  to `/login` with an explanation.
- `PrivateRoute` / `RoleRoute` guards mirroring backend's
  `protect`/`authorize()`
- `StatusBadge` (8 statuses), `DateTimePicker` (custom AM/PM, not native
  `datetime-local`)
- `Skeleton.jsx` / `EmptyState.jsx` — shared pulsing-card loading
  placeholders and a consistent "nothing here yet" block, used across
  every dashboard instead of bare "Loading…" text and gray one-liners
  (also filled in two empty states that were silently missing — All
  Users and Admin Donations previously just showed a blank filter
  dropdown with nothing below it when a filter matched zero results)
- Mobile layout pass: navbar wraps instead of overflowing on narrow
  screens (user's name hides below `sm:`, notification toggle collapses
  to icon-only below `sm:`)
- **Restaurant Dashboard** (`/restaurant`) — post form (multipart, photo,
  geolocation), Cancel, Confirm Handover, and now live
  `donation-accepted`/`donation-completed` updates — cards show who
  accepted (NGO) and who's delivering (volunteer) once assigned
- **NGO Dashboard** (`/ngo`) — Accept (inline institution create/select,
  no separate Institutions page), Assign Volunteer, Confirm Delivery,
  live `new-donation`/`donation-delivered` updates
- **Volunteer Dashboard** (`/volunteer`) — Mark Delivered, live
  `new-assignment` updates
- **Admin Dashboard** (`/admin`) — four tabs: Pending approvals
  (approve/reject restaurant & NGO signups), All users (filter by role,
  enable/disable), Stats (donations by status, users by role/approval,
  total completed), Donations (monitor all, filter by status)

## Notes on registration flow

A freshly-registered restaurant/NGO account is `pending` and can't do
anything role-gated yet even though `/register` hands back a usable
token — and `/login` itself blocks pending accounts. So
`AuthContext.register()` deliberately does **not** auto-authenticate the
user; it just reports success and the Register page redirects to
`/login` with a status message instead.

## Backend patches delivered separately (apply if you haven't already)

1. **`donationController.js` / `donationRoutes.js`** — added
   `GET /api/donations/my-ngo-donations` (didn't exist originally).
2. **`server.js`** — collapsed a duplicate `io.on('connection', ...)`
   handler into one (was harmless but redundant).
3. **Push notification patch** (`foodbridge-backend-push-patch.zip`) —
   extract into your backend root; creates/overwrites `app.js`,
   `models/User.js`, `controllers/donationController.js`,
   `controllers/pushController.js`, `routes/pushRoutes.js`,
   `utils/pushNotify.js`, `config/webpush.js`. Then:
   1. `npm install web-push`
   2. Add to your backend's `.env`:
      ```
      VAPID_PUBLIC_KEY=BOBoWeYJi2Wa3PTReX9SWvq16u1tBez_CugBrPApkvWmh5uxznMW6a5VFi_RoUp-zmatqG_y-Y2V_FrVsSPGTMk
      VAPID_PRIVATE_KEY=OPw2EjWSA2-Yexq-FYz37X_PvPwpTYT0Hpt0chPJRiw
      VAPID_CONTACT_EMAIL=you@example.com
      ```
      (Real, generated keys — fine for dev. Treat the private key as a
      secret; don't reuse these for a real production deployment.)
   3. Restart the backend.

   New endpoints: `GET /api/push/vapid-public-key` (public),
   `POST /api/push/subscribe`, `POST /api/push/unsubscribe` (protected).
   `User` gained a `pushSubscriptions` array field — additive only.
4. **Final patch** (`foodbridge-backend-final-patch.zip`) — extract into
   your backend root; overwrites `controllers/authController.js` and
   `controllers/donationController.js` (this one builds on top of patch 3
   above — has the push-notification code baked in too, so applying it
   doesn't undo anything). Three changes:
   - `registerUser` now returns `approvalStatus` instead of the dead
     `isApproved` field.
   - `acceptDonation` and `confirmDelivery` now emit
     `donation-accepted` / `donation-completed` (socket + push) to the
     *restaurant's* room — closing the last live-update gap.
   - `getMyDonations` now populates `ngo`/`volunteer`/`institution`, so
     the Restaurant Dashboard can actually show who accepted / who's
     delivering (previously those were just raw ObjectIds).

## Next steps

1. ~~401 interceptor~~ **Done** — also catches the disabled-account 403
2. ~~Polish pass~~ **Done** — loading skeletons, empty states (including
   two that were silently missing), mobile navbar wrap
3. ~~Restaurant live updates~~ **Done** — `donation-accepted` and
   `donation-completed`, socket + push, requires the final backend patch
4. ~~`isApproved` dead field~~ **Done** — requires the final backend patch

Nothing outstanding — every item from the original handover doc's gaps,
plus everything found along the way, is now built and wired up. Anything
past this point (deployment, automated tests, production hardening) is
new scope, not a leftover.
