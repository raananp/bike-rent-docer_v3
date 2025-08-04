require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const bookingsRoute = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const bikeRoutes = require('./routes/bikeRoutes');
const authRoutes = require('./routes/auth'); // ✅ Add this line

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/bookings', bookingsRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/auth', authRoutes); // ✅ Mount the new auth route

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));