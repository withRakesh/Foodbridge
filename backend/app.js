const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRoutes = require('./routes/donationRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const pushRoutes = require('./routes/pushRoutes');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route

app.get('/', (req, res) => {
  res.json({ message: 'FoodBridge API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/push', pushRoutes);

module.exports = app;