const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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

// 👇 Upload to S3 with clean filename convention
const uploadToS3 = async (file, firstName, lastName, type) => {
  const extension = mime.extension(file.mimetype);
  const key = `${firstName}-${lastName}-${type}.${extension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  return key; // just return the key, not full URL
};

// 👇 Get a signed URL from S3 key
const generateSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 60 * 60 }); // 1 hour
};

// ✅ GET all bookings (with signed URLs)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    const signedBookings = await Promise.all(bookings.map(async (b) => {
      const result = {
        ...b.toObject(),
      };

      if (b.licenseFileUrl) {
        result.licenseSignedUrl = await generateSignedUrl(b.licenseFileUrl);
      }

      if (b.passportFileUrl) {
        result.passportSignedUrl = await generateSignedUrl(b.passportFileUrl);
      }

      return result;
    }));

    res.json(signedBookings);
  } catch (err) {
    console.error('Failed to get bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ✅ POST new booking
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

    const licenseKey = req.files.licenseFile
      ? await uploadToS3(req.files.licenseFile[0], firstName, lastName, 'License')
      : null;

    const passportKey = req.files.passportFile
      ? await uploadToS3(req.files.passportFile[0], firstName, lastName, 'Passport')
      : null;

    const newBooking = new Booking({
      firstName,
      lastName,
      startDateTime: start,
      endDateTime: end,
      numberOfDays,
      bike,
      insurance,
      licenseFileUrl: licenseKey,
      passportFileUrl: passportKey,
    });

    const saved = await newBooking.save();
    res.json(saved);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Booking creation failed' });
  }
});

module.exports = router;