// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

const User = require('../models/User');
const EmailToken = require('../models/EmailToken');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();

/* ------------------------- helpers ------------------------- */
function signAccess(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}
function signRefresh(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function setRefreshCookie(res, token) {
  res.cookie('rt', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
function toSafeUser(u) {
  if (!u) return null;
  return {
    id: u._id,
    email: u.email,
    role: u.role || 'user',
    firstName: u.firstName || '',
    lastName: u.lastName || '',
  };
}

/* --------------------- Auth middleware (bearer) --------------------- */
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role || 'user',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/* ----------------------------- SIGNUP ----------------------------- */
router.post('/signup', async (req, res) => {
  try {
    const { firstName = '', lastName = '', email = '', password = '' } = req.body || {};
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    // password hashed in User model pre('save')
    const user = await User.create({
      firstName, lastName, email, password,
      role: 'user', emailVerified: false, mfaEnabled: false,
    });

    // email verification token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await EmailToken.create({ userId: user._id, token, expiresAt });

    const verifyLink = `${process.env.PUBLIC_BASE_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(email, verifyLink);

    res.status(201).json({
      ok: true,
      message: 'Signup successful. Check your email to verify your account.',
    });
  } catch (e) {
    console.error('signup', e);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/* ------------------------- VERIFY EMAIL ------------------------- */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const doc = await EmailToken.findOne({ token });
    if (!doc || doc.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(doc.userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    await doc.deleteOne();

    // Auto-login payload so frontend can set context immediately
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    // (Optional) set cookie:
    // setRefreshCookie(res, refreshToken);

    return res.json({
      ok: true,
      message: 'Email verified!',
      token: accessToken,
      refreshToken,
      user: toSafeUser(user),
    });
  } catch (e) {
    console.error('verify-email', e);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ----------------------------- LOGIN ----------------------------- */
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    if (user.mfaEnabled && user.mfaSecret) {
      const temp = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ mfa_required: true, tempToken: temp });
    }

    const access = signAccess(user);
    const refresh = signRefresh(user);
    setRefreshCookie(res, refresh);
    res.json({ token: access, user: toSafeUser(user) });
  } catch (e) {
    console.error('login', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* --------------------------- REFRESH TOKEN --------------------------- */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

    const access = signAccess(user);
    const newRefresh = signRefresh(user); // rotate
    setRefreshCookie(res, newRefresh);

    res.json({ token: access, user: toSafeUser(user) });
  } catch (e) {
    console.error('refresh', e);
    res.status(401).json({ error: 'Refresh failed' });
  }
});

/* ----------------------------- LOGOUT ----------------------------- */
router.post('/logout', (req, res) => {
  res.clearCookie('rt', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/api/auth',
  });
  res.json({ ok: true });
});

/* ------------------------------- MFA ------------------------------- */
router.post('/mfa/setup', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'BikeRental', secret);
    const qrDataUrl = await qrcode.toDataURL(otpauth);

    user.mfaSecret = secret;
    user.mfaEnabled = false;
    await user.save();

    res.json({ otpauth, qrDataUrl });
  } catch (e) {
    console.error('mfa setup', e);
    res.status(500).json({ error: 'Failed to start MFA setup' });
  }
});

router.post('/mfa/confirm', requireAuth, async (req, res) => {
  try {
    const { code = '' } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user?.mfaSecret) return res.status(400).json({ error: 'No secret set' });

    const ok = authenticator.check(code, user.mfaSecret);
    if (!ok) return res.status(401).json({ error: 'Invalid code' });

    user.mfaEnabled = true;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error('mfa confirm', e);
    res.status(500).json({ error: 'Failed to confirm MFA' });
  }
});

router.post('/mfa/disable', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error('mfa disable', e);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

/* --------------------------- MFA VERIFY (login) --------------------------- */
router.post('/mfa/verify', async (req, res) => {
  try {
    const { code = '', tempToken = '' } = req.body || {};
    const payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not enabled' });
    }
    const ok = authenticator.check(code, user.mfaSecret);
    if (!ok) return res.status(401).json({ error: 'Invalid code' });

    const access = signAccess(user);
    const refresh = signRefresh(user);
    setRefreshCookie(res, refresh);

    res.json({ token: access, user: toSafeUser(user) });
  } catch (e) {
    console.error('mfa verify', e);
    return res.status(400).json({ error: 'MFA verification failed' });
  }
});

module.exports = router;