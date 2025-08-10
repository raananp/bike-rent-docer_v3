const jwt = require('jsonwebtoken');

// Simple JWT auth middleware.
// Expects Authorization: Bearer <token>
// Token payload should include at least { id, email }.
module.exports = function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const payload = jwt.verify(token, secret);
    // attach minimal user info to request
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};