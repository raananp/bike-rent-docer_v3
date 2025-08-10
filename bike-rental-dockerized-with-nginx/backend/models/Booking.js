const mongoose = require('mongoose');

const verificationSub = new mongoose.Schema({
  status: { type: String, enum: ['pending','passed','failed','skipped'], default: 'pending' },
  reason: { type: String },              // optional message (why failed/passed)
  fields: { type: mongoose.Schema.Types.Mixed }, // extracted fields
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime:   { type: Date, required: true },
  numberOfDays:  { type: Number, required: true },
  bike: { type: String, required: true },
  insurance: { type: Boolean, default: false },
  licenseFileUrl:  { type: String },
  passportFileUrl: { type: String },
  totalPrice: { type: Number, required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, required: true },

  // unified verification object (what your Admin table reads)
  verification: {
    status:   { type: String, enum: ['pending','passed','failed','skipped'], default: 'pending' },
    license:  { type: verificationSub, default: () => ({ status: 'pending' }) },
    passport: { type: verificationSub, default: () => ({ status: 'pending' }) },
    updatedAt:{ type: Date, default: Date.now },
  },

  // PDPA bits (already discussed)
  consentGiven: { type: Boolean, default: false },
  consentTextVersion: { type: String },
  consentAt: { type: Date },
  dataRetentionDays: { type: Number, default: 90 },
}, {
  timestamps: true,
});

bookingSchema.index({ userEmail: 1, startDateTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);