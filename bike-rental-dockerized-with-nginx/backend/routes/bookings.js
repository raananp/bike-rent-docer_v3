const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const mime = require('mime-types');
const Booking = require('../models/Booking');

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'licenseFile', maxCount: 1 },
  { name: 'passportFile', maxCount: 1 },
]);

const uploadToS3 = async (file) => {
  const extension = mime.extension(file.mimetype);
  const key = `${crypto.randomUUID()}.${extension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST new booking
router.post('/', upload, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      startDateTime,
      numberOfDays,
      bike,
      insurance,
    } = req.body;

    const start = new Date(startDateTime);
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(numberOfDays));

    const licenseUrl = req.files.licenseFile
      ? await uploadToS3(req.files.licenseFile[0])
      : null;

    const passportUrl = req.files.passportFile
      ? await uploadToS3(req.files.passportFile[0])
      : null;

    const newBooking = new Booking({
      firstName,
      lastName,
      startDateTime: start,
      endDateTime: end,
      numberOfDays,
      bike,
      insurance,
      licenseFileUrl: licenseUrl,
      passportFileUrl: passportUrl,
    });

    const saved = await newBooking.save();
    res.json(saved);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Booking creation failed' });
  }
});

module.exports = router;