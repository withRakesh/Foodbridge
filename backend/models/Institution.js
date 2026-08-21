const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['orphanage', 'old_age_home', 'shelter', 'other'],
      required: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institution', institutionSchema);