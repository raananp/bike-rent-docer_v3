// backend/routes/user.js
const express = require('express');
const auth = require('../middleware/auth');  // ✅ correct import
const User = require('../models/User');

const router = express.Router();

/** Get current user's profile */
router.get('/me', auth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id).lean();
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: u._id,
      email: u.email,
      role: u.role || 'user',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      mfaEnabled: !!u.mfaEnabled,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

/** Change password (duplicate of /auth/change-password is fine or remove one) */
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing currentPassword or newPassword' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ error: 'Current password incorrect' });

    user.password = newPassword; // pre('save') in model will hash it
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/** Privacy request: purge docs after rental */
router.post('/privacy/purge-docs', auth, async (req, res) => {
  try {
    console.log('[privacy] purge-docs request from', req.user.id);
    // TODO: delete passport/license files tied to COMPLETED bookings for req.user.id
    res.json({ ok: true, message: 'Your request has been received.' });
  } catch {
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

module.exports = router;