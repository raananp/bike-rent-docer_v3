// models/EmailToken.js
const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  token:   { type: String, index: true }, // random string
  expiresAt: { type: Date, index: true },
}, { timestamps: true });

emailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto TTL

module.exports = mongoose.model('EmailToken', emailTokenSchema);