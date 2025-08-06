// backend/models/Bike.js

const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  modelYear: { type: String, required: true },
  km: { type: String, required: true },
  perDay: { type: Number, required: true },
  perWeek: { type: Number, required: true },
  perMonth: { type: Number, required: true },
  imageUrl: { type: String }, // ✅ Field for storing uploaded image URL
  type: {
    type: String,
    enum: ['Speed Bike', 'Cruiser', 'Scooter'],
    default: 'Speed Bike', // ✅ Default type if not specified
  },
});

module.exports = mongoose.model('Bike', bikeSchema);