const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  duration: { type: Number, required: true },
  bike: { type: String, required: true },
  insurance: { type: Boolean, default: false },
  licenseUploaded: { type: Boolean, default: false },
  passportUploaded: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', bookingSchema);
