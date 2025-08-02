const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  startDateTime: String,
  endDateTime: String,
  numberOfDays: String,
  bike: String,
  insurance: Boolean,
  licenseUploaded: Boolean,
  passportUploaded: Boolean,
  licenseUrl: String,
  passportUrl: String,
});

module.exports = mongoose.model('Booking', bookingSchema);