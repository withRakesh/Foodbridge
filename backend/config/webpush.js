const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL ? `mailto:${process.env.VAPID_CONTACT_EMAIL}` : 'mailto:admin@foodbridge.example',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = webpush;
