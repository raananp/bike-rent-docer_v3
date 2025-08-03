const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name: String,
  modelYear: String,
  km: String,
  perDay: Number,
  perWeek: Number,
  perMonth: Number,
});

module.exports = mongoose.model('Bike', bikeSchema);