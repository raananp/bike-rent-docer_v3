// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const bookingsRoute   = require('./routes/bookings');
const adminRoutes     = require('./routes/admin');
const bikeRoutes      = require('./routes/bikeRoutes');
const authRoutes      = require('./routes/auth');
const statsRouter     = require('./routes/stats');
const analyticsRoutes = require('./routes/analytics');
const userRoutes      = require('./routes/user');
const paymentsRoutes  = require('./routes/payments'); // <-- make sure this exports an Express.Router

const app = express();
app.set('trust proxy', 1);

/* ---------- CORS (multi-origin friendly) ---------- */
const allowed = new Set(
  (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
);
// Add convenient defaults for dev/your host:
allowed.add('http://51.16.244.84');
allowed.add('http://localhost:3000');

app.use(cors({
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: (origin, cb) => {
    // allow same-origin / curl / Postman (no origin header)
    if (!origin) return cb(null, true);
    return cb(null, allowed.has(origin));
  },
}));
app.options('*', cors()); // preflight

/* ---------- Parsers & cookies ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));   // <-- add this
app.use(cookieParser());

/* ---------- Health ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ---------- Quick guard to catch bad routers ---------- */
function useRouter(path, r) {
  const ok = r && typeof r === 'function' && (r.name === 'router' || r.stack);
  if (!ok) {
    console.error(`❌ Route at ${path} is not an Express router. Got:`, typeof r, r);
    throw new Error(`Router at ${path} must export an Express.Router (module.exports = router)`);
  }
  app.use(path, r);
}

/* ---------- API routes ---------- */
useRouter('/api/bookings', bookingsRoute);
useRouter('/api/admin',    adminRoutes);
useRouter('/api/bikes',    bikeRoutes);
useRouter('/api/auth',     authRoutes);
useRouter('/api/stats',    statsRouter);
useRouter('/api/analytics', analyticsRoutes);
useRouter('/api/admin/analytics', analyticsRoutes);
useRouter('/api/user', userRoutes);
useRouter('/api/payments', paymentsRoutes);

/* ---------- 404 for unknown /api paths ---------- */
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- Error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

/* ---------- MongoDB ---------- */
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) console.error('❌ MONGO_URI is not set');

mongoose.connect(mongoUri, { })
  .then(async () => {
    console.log('✅ MongoDB connected');
    try {
      const Booking = require('./models/Booking');
      if (Booking?.syncIndexes) {
        await Booking.syncIndexes();
        console.log('✅ Booking indexes synced');
      }
    } catch {}
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err?.message || err));

module.exports = app;