const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

/* ------------------------- AWS S3 CLIENT ------------------------- */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ---------------------- MULTER (S3 STORAGE) ---------------------- */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // keep private; we sign URLs below
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const orig = file.originalname || 'file';
      const ext  = (orig.includes('.') ? orig.split('.').pop() : '').toLowerCase();
      // safe-ish base name
      const baseName =
        `${(req.body.name || 'bike')}-${(req.body.modelYear || 'unknown')}`.replace(/[^\w.-]+/g, '-');
      const filename = `${baseName}-${uuidv4()}${ext ? '.' + ext : ''}`;
      cb(null, filename);
    },
  }),
});

/* ---------------------- HELPER: EXTRACT S3 KEY ------------------- */
function extractS3Key(imageUrlOrKey = '') {
  if (!imageUrlOrKey) return '';
  try {
    // If it's a full https://s3.amazonaws.com/bucket/key or https://bucket.s3.*.amazonaws.com/key
    const u = new URL(imageUrlOrKey);
    // pathname starts with "/"
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    return key;
  } catch {
    // Not a URL; assume it’s already a key
    return imageUrlOrKey;
  }
}

/* -------------------- GET /api/bikes (list) ---------------------- */
router.get('/', async (_req, res) => {
  try {
    const bikes = await Bike.find().sort({ createdAt: -1 });

    const signedBikes = await Promise.all(
      bikes.map(async (bike) => {
        let signedUrl = '';
        const key = extractS3Key(bike.imageUrl);
        if (key) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: key,
            });
            signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
          } catch (err) {
            console.error(`Error signing URL for bike ${bike._id}:`, err.message);
          }
        }
        return { ...bike.toObject(), signedImageUrl: signedUrl };
      })
    );

    res.json(signedBikes);
  } catch (err) {
    console.error('Failed to fetch bikes:', err);
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

/* ----------------- GET /api/bikes/:id (single) ------------------- */
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Not found' });

    let signedImageUrl = '';
    const key = extractS3Key(bike.imageUrl);
    if (key) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
        });
        signedImageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      } catch (err) {
        console.error(`Error signing URL for bike ${bike._id}:`, err.message);
      }
    }

    res.json({ ...bike.toObject(), signedImageUrl });
  } catch (err) {
    console.error('GET /api/bikes/:id failed:', err);
    res.status(500).json({ error: 'Failed to fetch bike' });
  }
});

/* -------------- POST /api/bikes (create + upload) ---------------- */
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    const {
      name,
      modelYear,
      km,
      perDay,
      perWeek,
      perMonth,
      type,
    } = req.body;

    const newBike = new Bike({
      name,
      modelYear: Number(modelYear),
      km: Number(km),
      perDay: Number(perDay),
      perWeek: Number(perWeek),
      perMonth: Number(perMonth),
      type,
      imageUrl: req.file?.location || req.file?.key || '', // location if full URL; key fallback
    });

    await newBike.save();
    res.status(201).json(newBike);
  } catch (err) {
    console.error('Error uploading bike:', err);
    res.status(500).json({ error: 'Failed to add bike' });
  }
});

/* ------------------- DELETE /api/bikes/:id ----------------------- */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    // Attempt to delete image from S3 if present
    const key = extractS3Key(bike.imageUrl);
    if (key) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
        }));
      } catch (s3Err) {
        console.error('Failed to delete image from S3:', s3Err.message);
        // continue even if S3 deletion fails
      }
    }

    await Bike.findByIdAndDelete(id);
    res.json({ message: 'Bike and image deleted successfully' });
  } catch (err) {
    console.error('Failed to delete bike:', err);
    res.status(500).json({ error: 'Failed to delete bike' });
  }
});

module.exports = router;