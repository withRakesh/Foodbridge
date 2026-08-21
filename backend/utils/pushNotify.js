const webpush = require('../config/webpush');
const User = require('../models/User');

// Sends a push notification to every device/browser this user has
// subscribed on. If a subscription has gone stale (browser says 404/410 —
// the user uninstalled, cleared site data, etc.), we prune it so we stop
// wasting calls on it.
async function sendPushToUser(userId, payload) {
  const user = await User.findById(userId).select('pushSubscriptions');
  if (!user || !user.pushSubscriptions?.length) return;

  const body = JSON.stringify(payload);
  const staleEndpoints = [];

  await Promise.all(
    user.pushSubscriptions.map((sub) =>
      webpush.sendNotification(sub, body).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('Push send failed:', err.message);
        }
      })
    )
  );

  if (staleEndpoints.length) {
    user.pushSubscriptions = user.pushSubscriptions.filter(
      (sub) => !staleEndpoints.includes(sub.endpoint)
    );
    await user.save();
  }
}

// Sends to every active user with the given role (e.g. every NGO, when a
// new donation is posted) — mirrors the io.to('role:ngo') socket broadcast.
async function sendPushToRole(role, payload) {
  const users = await User.find({ role, isActive: true }).select('_id');
  await Promise.all(users.map((u) => sendPushToUser(u._id, payload)));
}

module.exports = { sendPushToUser, sendPushToRole };
