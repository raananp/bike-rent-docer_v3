const mongoose = require('mongoose');

const verificationSub = new mongoose.Schema({
  status: { type: String, enum: ['pending','passed','failed','skipped'], default: 'pending' },
  reason: { type: String },
  fields: { type: mongoose.Schema.Types.Mixed },
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

  // NEW: delivery selection
  deliveryLocation: {
    type: String,
    enum: ['office_pattaya', 'delivery_pattaya', 'bangkok', 'phuket', 'chiang_mai'],
    default: 'office_pattaya',
  },
  deliveryFee: { type: Number, default: 0 },

  // unified verification object (what your Admin table reads)
  verification: {
    status:   { type: String, enum: ['pending','passed','failed','skipped'], default: 'pending' },
    license:  { type: verificationSub, default: () => ({ status: 'pending' }) },
    passport: { type: verificationSub, default: () => ({ status: 'pending' }) },
    updatedAt:{ type: Date, default: Date.now },
  },

  // PDPA bits
  consentGiven: { type: Boolean, default: false },
  consentTextVersion: { type: String },
  consentAt: { type: Date },
  dataRetentionDays: { type: Number, default: 90 },
}, {
  timestamps: true,
});

bookingSchema.index({ userEmail: 1, startDateTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);