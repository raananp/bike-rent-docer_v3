const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// S3 client setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer S3 config
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // leave as private, we’ll sign the URL later
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      const filename = `${req.body.name}-${req.body.modelYear}-${uuidv4()}.${ext}`;
      cb(null, filename);
    },
  }),
});

// 🚀 GET all bikes with signed image URLs
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();

    const signedBikes = await Promise.all(
      bikes.map(async (bike) => {
        let signedUrl = '';
        if (bike.imageUrl) {
          try {
            const url = new URL(bike.imageUrl);
            const key = decodeURIComponent(url.pathname.substring(1)); // FIX HERE

            const command = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: key,
            });
            signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
          } catch (err) {
            console.error(`Error signing URL for bike ${bike._id}:`, err.message);
          }
        }

        return {
          ...bike.toObject(),
          signedImageUrl: signedUrl,
        };
      })
    );

    res.json(signedBikes);
  } catch (err) {
    console.error('Failed to fetch bikes:', err);
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

// POST new bike with upload
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, modelYear, km, perDay, perWeek, perMonth, type } = req.body; // ✅ include `type`

    const newBike = new Bike({
      name,
      modelYear,
      km,
      perDay,
      perWeek,
      perMonth,
      type, // ✅ add here
      imageUrl: req.file?.location || '',
    });

    await newBike.save();
    res.status(201).json(newBike);
  } catch (err) {
    console.error('Error uploading bike:', err);
    res.status(500).json({ error: 'Failed to add bike' });
  }
});

// DELETE a bike
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Bike.findByIdAndDelete(id);
    res.json({ message: 'Bike deleted successfully' });
  } catch (err) {
    console.error('Failed to delete bike:', err);
    res.status(500).json({ error: 'Failed to delete bike' });
  }
});

module.exports = router;