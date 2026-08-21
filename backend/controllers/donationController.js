const Donation = require('../models/Donation');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { sendPushToUser, sendPushToRole } = require('../utils/pushNotify');

// @desc    Post a new surplus food donation
// @route   POST /api/donations
// @access  Private/Restaurant (approved only)
const createDonation = async (req, res) => {
  try {
    if (req.user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Your restaurant account is not approved to post donations' });
    }

    const { foodName, quantity, preparedTime, expiryTime, location } = req.body;

    if (!foodName || !quantity || !preparedTime || !expiryTime || !location) {
      return res.status(400).json({ message: 'Please provide all required donation fields' });
    }

    let parsedLocation;
    try {
      parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    } catch (err) {
      return res.status(400).json({ message: 'Location must be valid JSON' });
    }

    if (!parsedLocation.address || parsedLocation.lat === undefined || parsedLocation.lng === undefined) {
      return res.status(400).json({ message: 'Location must include address, lat, and lng' });
    }

    const expiry = new Date(expiryTime);
    const prepared = new Date(preparedTime);

    if (expiry <= prepared) {
      return res.status(400).json({ message: 'Expiry time must be after prepared time' });
    }

    if (expiry <= new Date()) {
      return res.status(400).json({ message: 'Expiry time must be in the future' });
    }

   const donation = await Donation.create({
      restaurant: req.user._id,
      foodName,
      quantity,
      preparedTime: prepared,
      expiryTime: expiry,
      location: {
        address: parsedLocation.address.trim(),
        lat: parsedLocation.lat,
        lng: parsedLocation.lng,
        geo: {
          type: 'Point',
          coordinates: [parsedLocation.lng, parsedLocation.lat],
        },
      },
      imageUrl: req.file ? req.file.path : null,
    });

    // Notify all connected NGOs in real-time
    const io = req.app.get('io');
    io.to('role:ngo').emit('new-donation', {
      message: `New surplus food posted: ${donation.foodName}`,
      donation,
    });
    sendPushToRole('ngo', {
      title: 'New surplus food posted',
      body: `${donation.foodName} — ${donation.quantity}`,
    }).catch((err) => console.error('Push (new-donation) failed:', err.message));

    res.status(201).json({ message: 'Donation posted successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Get logged-in restaurant's own donation history
// @route   GET /api/donations/my-donations
// @access  Private/Restaurant
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ restaurant: req.user._id })
      .populate('ngo', 'name email')
      .populate('volunteer', 'name email')
      .populate('institution', 'name address')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel a posted donation (only before it's accepted)
// @route   PUT /api/donations/:id/cancel
// @access  Private/Restaurant
const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own donations' });
    }

    if (donation.status !== 'posted') {
      return res.status(400).json({
        message: `Cannot cancel a donation that is already "${donation.status}"`,
      });
    }

    donation.status = 'cancelled';
    await donation.save();

    res.status(200).json({ message: 'Donation cancelled successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all donations available for NGOs to accept
// @route   GET /api/donations/available
// @access  Private/NGO
const getAvailableDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      status: 'posted',
      expiryTime: { $gt: new Date() },
    })
      .populate('restaurant', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Accept an available donation
// @desc    Accept an available donation
// @route   PUT /api/donations/:id/accept
// @access  Private/NGO
const acceptDonation = async (req, res) => {
  try {
    if (req.user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Your NGO account is not approved to accept donations' });
    }

    const { institutionId } = req.body;

    if (!institutionId) {
      return res.status(400).json({ message: 'institutionId is required' });
    }

    const institution = await Institution.findOne({ _id: institutionId, ngo: req.user._id });

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found or does not belong to your NGO' });
    }

    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: 'posted', expiryTime: { $gt: new Date() } },
      { ngo: req.user._id, institution: institution._id, status: 'accepted' },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        message: 'This donation is no longer available (already accepted, cancelled, or expired)',
      });
    }

    // Let the restaurant know their donation has been claimed
    const io = req.app.get('io');
    io.to(donation.restaurant.toString()).emit('donation-accepted', {
      message: `${req.user.name} accepted your donation: ${donation.foodName}`,
      donation,
    });
    sendPushToUser(donation.restaurant, {
      title: 'Donation accepted',
      body: `${req.user.name} accepted "${donation.foodName}" — you'll be notified when it's picked up.`,
    }).catch((err) => console.error('Push (donation-accepted) failed:', err.message));

    res.status(200).json({ message: 'Donation accepted successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Assign a volunteer to an accepted donation
// @route   PUT /api/donations/:id/assign-volunteer
// @access  Private/NGO
const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: 'volunteerId is required' });
    }

    const donation = await Donation.findOne({ _id: req.params.id, ngo: req.user._id });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found or does not belong to your NGO' });
    }

    if (donation.status !== 'accepted') {
      return res.status(400).json({
        message: `Cannot assign a volunteer to a donation with status "${donation.status}"`,
      });
    }

    const volunteer = await User.findOneAndUpdate(
      { _id: volunteerId, role: 'volunteer', isActive: true, isAvailable: true },
      { isAvailable: false },
      { new: true }
    );

    if (!volunteer) {
      return res.status(409).json({ message: 'This volunteer is no longer available' });
    }

    donation.volunteer = volunteer._id;
    donation.status = 'volunteer_assigned';
    await donation.save();

    const io = req.app.get('io');
    io.to(volunteer._id.toString()).emit('new-assignment', {
      message: `You have been assigned to collect: ${donation.foodName}`,
      donation,
    });
    sendPushToUser(volunteer._id, {
      title: 'New pickup assigned',
      body: `Collect: ${donation.foodName} — ${donation.quantity}`,
    }).catch((err) => console.error('Push (new-assignment) failed:', err.message));

    res.status(200).json({ message: 'Volunteer assigned successfully', donation });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    NGO confirms receipt of a delivered donation
// @route   PUT /api/donations/:id/confirm-delivery
// @access  Private/NGO
const confirmDelivery = async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, ngo: req.user._id, status: 'delivered' },
      { status: 'completed' },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        message: 'Donation not found, does not belong to your NGO, or has not been marked delivered yet',
      });
    }

    // Free up the volunteer now that the full cycle is done
    await User.findByIdAndUpdate(donation.volunteer, { isAvailable: true });

    // Let the restaurant know their donation completed the full journey
    const io = req.app.get('io');
    io.to(donation.restaurant.toString()).emit('donation-completed', {
      message: `Your donation "${donation.foodName}" was delivered and confirmed. Thank you!`,
      donation,
    });
    sendPushToUser(donation.restaurant, {
      title: 'Donation completed',
      body: `"${donation.foodName}" made it all the way to delivery — thank you!`,
    }).catch((err) => console.error('Push (donation-completed) failed:', err.message));

    res.status(200).json({ message: 'Delivery confirmed. Donation completed successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get donations assigned to the logged-in volunteer
// @route   GET /api/donations/my-assignments
// @access  Private/Volunteer
const getMyAssignments = async (req, res) => {
  try {
    const donations = await Donation.find({
      volunteer: req.user._id,
      status: { $in: ['volunteer_assigned', 'collected', 'delivered'] },
    })
      .populate('restaurant', 'name email')
      .populate('ngo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Restaurant confirms handover of food to the assigned volunteer
// @route   PUT /api/donations/:id/confirm-handover
// @access  Private/Restaurant
const confirmHandover = async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user._id, status: 'volunteer_assigned' },
      { status: 'collected', pickupConfirmedBy: req.user._id, pickupConfirmedAt: new Date() },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        message: 'Donation not found, does not belong to you, or is not awaiting handover',
      });
    }

    res.status(200).json({ message: 'Handover confirmed successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Volunteer marks donation as delivered to NGO
// @route   PUT /api/donations/:id/mark-delivered
// @access  Private/Volunteer
const markDelivered = async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, volunteer: req.user._id, status: 'collected' },
      { status: 'delivered' },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        message: 'Donation not found, does not belong to you, or has not been collected yet',
      });
    }

    const io = req.app.get('io');
    io.to(donation.ngo.toString()).emit('donation-delivered', {
      message: `Your donation "${donation.foodName}" has been delivered. Please confirm receipt.`,
      donation,
    });
    sendPushToUser(donation.ngo, {
      title: 'Donation delivered',
      body: `"${donation.foodName}" has been delivered — please confirm receipt.`,
    }).catch((err) => console.error('Push (donation-delivered) failed:', err.message));

    res.status(200).json({ message: 'Marked as delivered successfully', donation });
 
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get donations the logged-in NGO has already accepted (in-progress
//          and completed), as opposed to /available and /nearby which only
//          ever return unclaimed "posted" donations.
// @route   GET /api/donations/my-ngo-donations
// @access  Private/NGO
const getMyNgoDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ ngo: req.user._id })
      .populate('restaurant', 'name email')
      .populate('volunteer', 'name email')
      .populate('institution', 'name address')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get donations near the NGO's location, within a radius
// @route   GET /api/donations/nearby?lat=..&lng=..&radiusKm=..
// @access  Private/NGO
const getNearbyDonations = async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng query parameters are required' });
    }

    const radiusMeters = (radiusKm ? parseFloat(radiusKm) : 10) * 1000; // default 10km

    const donations = await Donation.find({
      status: 'posted',
      expiryTime: { $gt: new Date() },
      'location.geo': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusMeters,
        },
      },
    }).populate('restaurant', 'name email');

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createDonation,
  getMyDonations,
  cancelDonation,
  getAvailableDonations,
  acceptDonation,
  assignVolunteer,
  confirmDelivery,
  getMyAssignments,
  confirmHandover,
  markDelivered,
  getMyNgoDonations,
  getNearbyDonations,
};
 

 