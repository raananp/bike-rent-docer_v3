const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  startDateTime: { type: String, required: true },
  endDateTime: { type: String, required: true },
  numberOfDays: { type: Number, required: true },
  bike: { type: String, required: true },
  insurance: { type: Boolean, default: false },
  licenseUploaded: { type: Boolean, default: false },
  passportUploaded: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', bookingSchema);
