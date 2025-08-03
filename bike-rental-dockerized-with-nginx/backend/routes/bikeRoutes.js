const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');

router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newBike = new Bike(req.body);
    await newBike.save();
    res.status(201).json(newBike);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add bike' });
  }
});

module.exports = router;