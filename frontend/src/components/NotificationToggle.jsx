import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { getVapidPublicKey, savePushSubscription, removePushSubscription } from '../api/pushApi';
import { urlBase64ToUint8Array } from '../utils/pushHelpers';

const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export default function NotificationToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  if (!isSupported) return null;

  const handleEnable = async () => {
    setError(null);
    setBusy(true);
    let subscription = null;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setBusy(false);
        return;
      }

      const reg = registration ?? (await navigator.serviceWorker.ready);
      const { publicKey } = await getVapidPublicKey();

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // This call can fail even after a real browser subscription was
      // created above — e.g. the backend is cold-starting (Render free
      // tier sleeps after inactivity) and the request times out. If we
      // silently swallowed that, the browser would be left "subscribed"
      // with nothing to show for it: the bell would show as ON next time
      // this component mounts (getSubscription() finds the browser-side
      // subscription), but the backend never has a record to send to —
      // so push notifications would just never arrive, with no visible
      // sign anything's wrong. Unsubscribing on failure keeps the two
      // sides honest with each other.
      await savePushSubscription(subscription.toJSON());
      setSubscribed(true);
    } catch (err) {
      if (subscription) {
        await subscription.unsubscribe().catch(() => {});
      }
      setError('Could not enable notifications — check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError(null);
    setBusy(true);
    try {
      const reg = registration ?? (await navigator.serviceWorker.ready);
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      // no-op — disabling is best-effort, nothing critical hinges on it
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={busy}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:text-primary disabled:opacity-60"
        title={subscribed ? 'Notifications are on for this device' : 'Get notified even when the tab is closed'}
      >
        {subscribed ? (
          <Bell className="h-4 w-4 flex-none" strokeWidth={2} />
        ) : (
          <BellOff className="h-4 w-4 flex-none" strokeWidth={2} />
        )}
        <span className="hidden sm:inline">{subscribed ? 'On' : 'Enable notifications'}</span>
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-status-expired shadow-lg">
          {error}
        </p>
      )}
    </div>
  );
}
