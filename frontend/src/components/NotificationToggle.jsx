import { useEffect, useState } from 'react';
import { getVapidPublicKey, savePushSubscription, removePushSubscription } from '../api/pushApi';
import { urlBase64ToUint8Array } from '../utils/pushHelpers';

const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export default function NotificationToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState(null);

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
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setBusy(false);
        return;
      }

      const reg = registration ?? (await navigator.serviceWorker.ready);
      const { publicKey } = await getVapidPublicKey();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await savePushSubscription(subscription.toJSON());
      setSubscribed(true);
    } catch {
      // Silently no-op — most failures here are the user dismissing the
      // permission prompt, which isn't worth surfacing as an error.
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
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
      // no-op
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={subscribed ? handleDisable : handleEnable}
      disabled={busy}
      className="text-sm font-medium text-neutral-900 hover:text-primary disabled:opacity-60"
      title={subscribed ? 'Notifications are on for this device' : 'Get notified even when the tab is closed'}
    >
      {subscribed ? (
        '\ud83d\udd14'
      ) : (
        <>
          <span className="sm:hidden">{'\ud83d\udd15'}</span>
          <span className="hidden sm:inline">{'\ud83d\udd15 Enable notifications'}</span>
        </>
      )}
    </button>
  );
}
