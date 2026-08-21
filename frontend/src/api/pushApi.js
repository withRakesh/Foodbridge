import axiosInstance from './axiosInstance';

// GET /api/push/vapid-public-key — public, no auth needed
export const getVapidPublicKey = () =>
  axiosInstance.get('/push/vapid-public-key').then((res) => res.data);

// POST /api/push/subscribe — saves this browser's PushSubscription for the
// logged-in user
export const savePushSubscription = (subscription) =>
  axiosInstance.post('/push/subscribe', subscription).then((res) => res.data);

// POST /api/push/unsubscribe
export const removePushSubscription = (endpoint) =>
  axiosInstance.post('/push/unsubscribe', { endpoint }).then((res) => res.data);
