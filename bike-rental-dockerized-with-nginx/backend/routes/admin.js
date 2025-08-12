// 📁 backend/routes/admin.js
const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bike = require('../models/Bike');

const router = express.Router();

/* --------------------------- helpers --------------------------- */
function computeTieredPrice(days, insurance, bikeDoc) {
  if (!bikeDoc || !days) return 0;

  const d = Number(days) || 0;
  const perDay   = Number(bikeDoc.perDay   || 0);
  const perWeek  = Number(bikeDoc.perWeek  || 0);
  const perMonth = Number(bikeDoc.perMonth || 0);

  let base = 0;
  if (d >= 30) {
    const months   = Math.floor(d / 30);
    const remDays  = d % 30;
    const weeks    = Math.floor(remDays / 7);
    const daysLeft = remDays % 7;
    base = months * perMonth + weeks * perWeek + daysLeft * perDay;
  } else if (d >= 7) {
    const weeks    = Math.floor(d / 7);
    const daysLeft = d % 7;
    base = weeks * perWeek + daysLeft * perDay;
  } else {
    base = d * perDay;
  }

  // NOTE: adjust this to match your current booking creation rule if needed.
  const INSURANCE_PER_DAY = 100; // your BikeModal currently uses 100/day
  const insuranceCost = insurance ? d * INSURANCE_PER_DAY : 0;

  return base + insuranceCost;
}

function normalizeBikeKey(raw, bikeDoc) {
  if (bikeDoc) return `${bikeDoc.name || ''} ${bikeDoc.modelYear || ''}`.trim();
  if (typeof raw === 'string') return raw.trim() || 'Unknown';
  if (raw && raw._id) return String(raw._id);
  return 'Unknown';
}

/* ------------------------ Bookings stats ------------------------ */
// ✅ Get Booking Stats (keeps the same route your frontend calls)
router.get('/bookings/stats', async (_req, res) => {
  try {
    const [bookings, bikes] = await Promise.all([
      Booking.find().lean(),
      Bike.find().lean(),
    ]);

    // Quick lookups
    const bikeById = new Map();
    const bikeByComposite = new Map(); // "Name Model" -> doc
    for (const b of bikes) {
      bikeById.set(String(b._id), b);
      bikeByComposite.set(`${b.name || ''} ${b.modelYear || ''}`.trim(), b);
    }

    let totalBookings = bookings.length;
    let activeBookings = 0;
    let totalRevenue = 0;

    const profitMap = new Map(); // normalized bike name -> amount
    const now = new Date();

    for (const bk of bookings) {
      // active?
      if (bk.startDateTime && bk.endDateTime) {
        if (now >= bk.startDateTime && now <= bk.endDateTime) activeBookings += 1;
      }

      // find bikeDoc from stored bk.bike which might be id, object, or "Name Model"
      let bikeDoc = null;
      const rawBike = bk.bike;

      if (rawBike && typeof rawBike === 'object' && rawBike._id) {
        bikeDoc = bikeById.get(String(rawBike._id)) || null;
      } else if (bikeById.has(String(rawBike))) {
        bikeDoc = bikeById.get(String(rawBike));
      } else if (typeof rawBike === 'string') {
        bikeDoc = bikeByComposite.get(rawBike) || null;
      }

      const groupKey = normalizeBikeKey(rawBike, bikeDoc);

      // Use stored totalPrice; if 0/undefined, recompute from the bike card tiers
      let amount = Number(bk.totalPrice || 0);
      if (!amount || amount <= 0) {
        amount = computeTieredPrice(bk.numberOfDays, bk.insurance, bikeDoc);
      }

      totalRevenue += amount;
      profitMap.set(groupKey, (profitMap.get(groupKey) || 0) + amount);
    }

    const profitByBike = {};
    for (const [k, v] of profitMap.entries()) profitByBike[k] = v;

    // Extra insights for your dashboard (optional use on frontend)
    const insuranceUptakePct = bookings.length
      ? Math.round((bookings.filter(b => b.insurance).length / bookings.length) * 100)
      : 0;

    const verificationPassRate = bookings.length
      ? Math.round(
          (bookings.filter(b => (b.verification?.status || '').toLowerCase() === 'passed').length / bookings.length) * 100
        )
      : 0;

    const deliveryBreakdown = bookings.reduce((acc, b) => {
      const k = (b.deliveryLocation || 'unknown').toString();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalBookings,
      totalProfit: totalRevenue,   // keep key name your UI expects
      totalRevenue,
      activeBookings,
      profitByBike,
      insuranceUptakePct,
      verificationPassRate,
      deliveryBreakdown,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

/* -------------------------- Users admin ------------------------- */
// ✅ Get All Users (for Admin tab)
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email role');
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

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: prevent self-delete or require admin role here
    // if (req.user.id === id) return res.status(400).json({ error: 'Cannot delete yourself' });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });

    // 204 No Content or 200 with payload — your choice
    return res.status(204).send();
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;