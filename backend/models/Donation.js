const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    preparedTime: {
      type: Date,
      required: [true, 'Prepared time is required'],
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
   location: {
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
},
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'posted',
        'accepted',
        'volunteer_assigned',
        'collected',
        'delivered',
        'completed',
        'cancelled',
        'expired',
      ],
      default: 'posted',
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    pickupConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

donationSchema.index({ 'location.geo': '2dsphere' });

module.exports = mongoose.model('Donation', donationSchema);