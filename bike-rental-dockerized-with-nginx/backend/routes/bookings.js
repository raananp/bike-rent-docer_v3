const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike'); // ✅ Needed to pull image URLs

const router = express.Router();

// AWS S3 setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'licenseFile', maxCount: 1 },
  { name: 'passportFile', maxCount: 1 },
]);

// 🧮 Pricing logic
const bikePricing = {
  'Honda CB650R E-Clutch': { perDay: 500, perWeek: 3200, perMonth: 9800 },
  'Harley Davidson Fat Boy 2021': { perDay: 600, perWeek: 3900, perMonth: 10500 },
  'Harley Davidson Fat Boy 1990': { perDay: 450, perWeek: 3000, perMonth: 9000 },
};

const calculatePrice = (days, insurance, bike) => {
  const pricing = bikePricing[bike];
  if (!pricing) return 0;

  let total = 0;
  let remaining = days;

  const months = Math.floor(remaining / 30);
  total += months * pricing.perMonth;
  remaining -= months * 30;

  const weeks = Math.floor(remaining / 7);
  total += weeks * pricing.perWeek;
  remaining -= weeks * 7;

  total += remaining * pricing.perDay;

  // 🟡 Add base surcharge
  total += days * 50;

  // ✅ Insurance surcharge
  if (insurance === 'true' || insurance === true) {
    total += days * 50;
  }

  return total;
};

// Upload file to S3
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
  return key;
};

// Get pre-signed URL for file in S3
const generateSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const bikes = await Bike.find();

    const bikeMap = {};
    bikes.forEach((b) => {
      const key = `${b.name} ${b.modelYear}`.trim();
      bikeMap[key] = b;
    });

    const enrichedBookings = await Promise.all(
      bookings.map(async (b) => {
        const result = { ...b.toObject() };

        if (b.licenseFileUrl) {
          result.licenseSignedUrl = await generateSignedUrl(b.licenseFileUrl);
        }

        if (b.passportFileUrl) {
          result.passportSignedUrl = await generateSignedUrl(b.passportFileUrl);
        }

        // Add bike image + prices from DB
        const bike = bikeMap[b.bike];
        if (bike) {
          result.bikeImageUrl = bike.imageUrl || '';
          result.perDay = bike.perDay;
          result.perWeek = bike.perWeek;
          result.perMonth = bike.perMonth;
          result.km = bike.km;
        }

        return result;
      })
    );

    res.json(enrichedBookings);
  } catch (err) {
    console.error('Failed to get bookings:', err);
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

    const days = parseInt(numberOfDays);
    const start = new Date(startDateTime);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    const licenseKey = req.files.licenseFile
      ? await uploadToS3(req.files.licenseFile[0], firstName, lastName, 'License')
      : null;

    const passportKey = req.files.passportFile
      ? await uploadToS3(req.files.passportFile[0], firstName, lastName, 'Passport')
      : null;

    const totalPrice = calculatePrice(days, insurance, bike);

    const newBooking = new Booking({
      firstName,
      lastName,
      startDateTime: start,
      endDateTime: end,
      numberOfDays: days,
      bike,
      insurance,
      totalPrice,
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