const cron = require('node-cron');
const Donation = require('../models/Donation');

const startExpiryJob = () => {
  // Runs every 15 minutes
//   cron.schedule('*/15 * * * *', async () => {
    cron.schedule('*/10 * * * * *', async () => {
    try {
      const result = await Donation.updateMany(
        { status: 'posted', expiryTime: { $lte: new Date() } },
        { status: 'expired' }
      );

      if (result.modifiedCount > 0) {
        console.log(`Auto-expired ${result.modifiedCount} donation(s)`);
      }
    } catch (error) {
      console.error('Error running expiry job:', error.message);
    }
  });
};

module.exports = startExpiryJob;