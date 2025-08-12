require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// const path = require('path'); // not used when behind nginx

const bookingsRoute = require('./routes/bookings');
const adminRoutes   = require('./routes/admin');
const bikeRoutes    = require('./routes/bikeRoutes');
const authRoutes    = require('./routes/auth');
const statsRouter = require('./routes/stats');


const app = express();

/** Recommended when running behind Nginx/ELB */
app.set('trust proxy', 1);

/** CORS + JSON body parsing (FormData uploads still go through multer in routes) */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

/** Health check (handy for testing nginx->backend reachability) */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/** API routes (unchanged) */
app.use('/api/bookings', bookingsRoute);
app.use('/api/admin',    adminRoutes);
app.use('/api/bikes',    bikeRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/stats', statsRouter);

/** 404 for unknown /api paths (prevents HTML being parsed as JSON on the client) */
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/** Basic error handler */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

/** MongoDB connection */
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI is not set');
}

mongoose
  .connect(mongoUri, {
    // These options are defaults on modern Mongoose, but harmless:
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Optional: sync indexes once at startup (non-breaking)
    try {
      const Booking = require('./models/Booking');
      if (Booking && typeof Booking.syncIndexes === 'function') {
        await Booking.syncIndexes();
        console.log('✅ Booking indexes synced');
      }
    } catch (e) {
      // If model path changes or method missing, ignore silently
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message || err);
  });

/** Start server */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app; // optional export (useful for testing)