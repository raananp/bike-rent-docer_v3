// 📁 backend/routes/admin.js
const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const router = express.Router();

// ✅ Get Booking Stats (includes Profit by Bike)
router.get('/bookings/stats', async (req, res) => {
  try {
    const bookings = await Booking.find();

    const totalBookings = bookings.length;
    const totalProfit = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const activeBookings = bookings.filter(b => new Date(b.endDateTime) > new Date()).length;

    const profitByBike = {};
    bookings.forEach(b => {
      if (b.bike && b.totalPrice) {
        profitByBike[b.bike] = (profitByBike[b.bike] || 0) + b.totalPrice;
      }
    });

    res.json({ totalBookings, totalProfit, activeBookings, profitByBike });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// ✅ Get All Users (for Admin tab)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email role'); // ✅ include firstName and lastName
    res.json(users);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ✅ Update User Role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ success: true });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;