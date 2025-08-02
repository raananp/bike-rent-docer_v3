const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  startDateTime: String,
  endDateTime: String,
  numberOfDays: String,
  bike: String,
  insurance: Boolean,
  licenseFileUrl: String,   // ✅ match backend
  passportFileUrl: String,  // ✅ match backend
});

module.exports = mongoose.model('Booking', bookingSchema);