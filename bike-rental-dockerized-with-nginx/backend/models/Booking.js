const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  bike: { type: String, required: true },
  insurance: { type: Boolean, default: false },
  licenseFileUrl: { type: String },
  passportFileUrl: { type: String },
  totalPrice: { type: Number, required: true },
}, {
  timestamps: true, // optional: adds createdAt and updatedAt
});

module.exports = mongoose.model('Booking', bookingSchema);