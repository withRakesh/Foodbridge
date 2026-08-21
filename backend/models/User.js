const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'restaurant', 'ngo', 'volunteer'],
      required: true,
    },
    approvalStatus: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: function () {
    return this.role === 'admin' || this.role === 'volunteer' ? 'approved' : 'pending';
  },
},
    isActive: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
  type: Boolean,
  default: function () {
    return this.role === 'volunteer' ? true : undefined;
  },
},
    // Web Push subscriptions for this user — one per browser/device they've
    // enabled notifications on. Populated by POST /api/push/subscribe.
    pushSubscriptions: {
      type: [
        {
          endpoint: { type: String, required: true },
          keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};                                          

module.exports = mongoose.model('User', userSchema);