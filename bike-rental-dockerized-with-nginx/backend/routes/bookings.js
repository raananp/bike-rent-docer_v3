const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike'); // ✅ Needed to pull image URLs
const auth = require('../middleware/auth'); // ✅ JWT auth

const router = express.Router();

/* ---------- AWS setup (guarded) ---------- */
const CAN_AWS = Boolean(
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: CAN_AWS
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
    : undefined,
});

/* ---------- Multer setup ---------- */
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'licenseFile', maxCount: 1 },
  { name: 'passportFile', maxCount: 1 },
]);

/* ---------- Pricing ---------- */
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

  // base surcharge
  total += days * 50;

  // insurance surcharge
  if (insurance === 'true' || insurance === true) {
    total += days * 50;
  }

  return total;
};

/* ---------- S3 helpers ---------- */
const uploadToS3 = async (file, firstName, lastName, type) => {
  if (!CAN_AWS || !file) return null;
  const extension = mime.extension(file.mimetype) || 'bin';
  const safeFirst = (firstName || 'User').replace(/\s+/g, '_');
  const safeLast = (lastName || 'Unknown').replace(/\s+/g, '_');
  const key = `${safeFirst}-${safeLast}-${type}-${crypto.randomBytes(4).toString('hex')}.${extension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  return key;
};

const generateSignedUrl = async (key) => {
  if (!CAN_AWS || !key) return '';
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch (e) {
    console.error('Presign failed:', e.message);
    return '';
  }
};

/* ---------- Enrichment helper ---------- */
async function enrichBookings(bookings) {
  const bikes = await Bike.find();
  const bikeMap = {};
  bikes.forEach((b) => {
    const key = `${b.name} ${b.modelYear}`.trim();
    bikeMap[key] = b;
  });

  const enriched = await Promise.all(
    bookings.map(async (b) => {
      const result = { ...b.toObject() };

      if (b.licenseFileUrl) {
        result.licenseSignedUrl = await generateSignedUrl(b.licenseFileUrl);
      }
      if (b.passportFileUrl) {
        result.passportSignedUrl = await generateSignedUrl(b.passportFileUrl);
      }

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

  return enriched;
}

/* ---------- Routes ---------- */

// GET all bookings (admin views / availability)
router.get('/', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const enrichedBookings = await enrichBookings(bookings);
    res.json(enrichedBookings);
  } catch (err) {
    console.error('Failed to get bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET only my bookings (requires auth)
router.get('/mine', auth, async (req, res) => {
  try {
    const myEmail = req.user?.email;
    if (!myEmail) return res.status(400).json({ error: 'User email missing in token' });

    const bookings = await Booking.find({ userEmail: myEmail }).sort({ createdAt: -1 });
    const enrichedBookings = await enrichBookings(bookings);
    res.json(enrichedBookings);
  } catch (err) {
    console.error('Failed to get my bookings:', err);
    res.status(500).json({ error: 'Failed to fetch my bookings' });
  }
});

// POST new booking (requires auth)
router.post('/', auth, upload, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      startDateTime,
      numberOfDays,
      bike,
      insurance,
    } = req.body;

    if (!req.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(numberOfDays, 10);
    const start = new Date(startDateTime);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    const licenseKey = req.files?.licenseFile?.[0]
      ? await uploadToS3(req.files.licenseFile[0], firstName, lastName, 'License')
      : null;

    const passportKey = req.files?.passportFile?.[0]
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
      userId: req.user.id,
      userEmail: req.user.email,
    });

    const saved = await newBooking.save();
    res.json(saved);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Booking creation failed' });
  }
});

// DELETE booking (owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.userEmail && req.user?.email && booking.userEmail === req.user.email;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Optionally delete S3 objects
    if (CAN_AWS) {
      for (const key of [booking.licenseFileUrl, booking.passportFileUrl]) {
        if (!key) continue;
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
          }));
        } catch (e) {
          // Not fatal — keep going
          console.warn(`S3 delete failed for ${key}:`, e.message);
        }
      }
    }

    await Booking.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (e) {
    console.error('Delete booking failed:', e);
    return res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;