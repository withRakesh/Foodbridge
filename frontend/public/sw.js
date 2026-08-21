// FoodBridge service worker — only handles Web Push. No offline caching
// here; that's a separate concern this app doesn't need yet.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'FoodBridge', body: event.data.text() };
  }

  const title = payload.title || 'FoodBridge';
  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an already-open FoodBridge tab if one
// exists, otherwise opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
