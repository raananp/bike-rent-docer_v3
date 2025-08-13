// backend/models/AnalyticsEvent.js
const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // "page_view", "bike_open", etc.
    sessionId: { type: String, required: true },
    path: { type: String },                 // for page_view
    bikeId: { type: String },               // for bike_open
    bikeName: { type: String },
    ua: { type: String },                   // user-agent
    ip: { type: String },                   // anonymized/raw (behind proxy)
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Helpful indexes
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);