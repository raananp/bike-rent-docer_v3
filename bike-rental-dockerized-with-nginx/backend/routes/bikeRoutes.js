const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// multer-s3 storage config
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // can be 'public-read' if you want direct URL access
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      const filename = `${req.body.name}-${req.body.modelYear}-${uuidv4()}.${ext}`;
      cb(null, filename);
    },
  }),
});

// GET all bikes
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

// POST new bike with image upload
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, modelYear, km, perDay, perWeek, perMonth } = req.body;

    const newBike = new Bike({
      name,
      modelYear,
      km,
      perDay,
      perWeek,
      perMonth,
      imageUrl: req.file?.location || '', // Save S3 image URL
    });

    await newBike.save();
    res.status(201).json(newBike);
  } catch (err) {
    console.error('Error uploading bike:', err);
    res.status(500).json({ error: 'Failed to add bike' });
  }
});

module.exports = router;