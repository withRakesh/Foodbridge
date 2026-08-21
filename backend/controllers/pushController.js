const User = require('../models/User');

// @desc    Save a browser's push subscription for the logged-in user
// @route   POST /api/push/subscribe
// @access  Private
// Body: the raw PushSubscription object from the browser's
// pushManager.subscribe() — { endpoint, keys: { p256dh, auth } }
const subscribe = async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }

    const user = await User.findById(req.user._id);

    const alreadySaved = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!alreadySaved) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(200).json({ message: 'Subscribed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a browser's push subscription (e.g. user disabled notifications)
// @route   POST /api/push/unsubscribe
// @access  Private
// Body: { endpoint }
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: 'endpoint is required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } },
    });

    res.status(200).json({ message: 'Unsubscribed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get the server's VAPID public key, so the frontend can
//          subscribe without hardcoding it
// @route   GET /api/push/vapid-public-key
// @access  Public
const getVapidPublicKey = (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

module.exports = { subscribe, unsubscribe, getVapidPublicKey };
