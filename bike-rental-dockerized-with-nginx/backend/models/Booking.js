const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName:      { type: String, required: true },
  lastName:       { type: String, required: true },
  startDateTime:  { type: Date,   required: true },
  endDateTime:    { type: Date,   required: true },
  numberOfDays:   { type: Number, required: true },

  // Stores the readable bike name + model (e.g., "Honda CB650R E-Clutch 2024")
  bike:           { type: String, required: true },

  insurance:      { type: Boolean, default: false },
  licenseFileUrl: { type: String },
  passportFileUrl:{ type: String },
  totalPrice:     { type: Number, required: true },

  // Tie booking to the signed-in user
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail:      { type: String, required: true },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// 🔹 Index to speed up "my bookings" queries and recent-first sorts
bookingSchema.index({ userEmail: 1, startDateTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);