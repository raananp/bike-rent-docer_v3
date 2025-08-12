// backend/models/Bike.js

const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true },          // Brand
  modelYear: { type: String, required: true },     // Model (string to avoid NaN issue)
  km: { type: Number, required: true, default: 0 },// Keep as Number for math/sorting
  perDay: { type: Number, required: true },
  perWeek: { type: Number, required: true },
  perMonth: { type: Number, required: true },
  year: { type: Number },
  licensePlate: { type: String },
  imageUrl: { type: String }, // Field for storing uploaded image URL
  type: {
    type: String,
    enum: ['Speed Bike', 'Cruiser', 'Scooter'],
    default: 'Speed Bike',
  },
}, { timestamps: true }); // ✅ Adds createdAt & updatedAt fields

module.exports = mongoose.model('Bike', bikeSchema);