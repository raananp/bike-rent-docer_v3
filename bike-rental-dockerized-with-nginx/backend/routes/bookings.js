// backend/routes/bookings.js
const express = require('express');
const multer = require('multer');
const mime = require('mime-types');
const {
  S3Client, PutObjectCommand, GetObjectCommand,
} = require('@aws-sdk/client-s3');
const {
  TextractClient, AnalyzeIDCommand, DetectDocumentTextCommand,
} = require('@aws-sdk/client-textract');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const auth = require('../middleware/auth');

const router = express.Router();

/* ---------------------- AWS clients ---------------------- */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const TEXTRACT_ENABLED = (process.env.AUTO_VERIFY_DOCS || '').toLowerCase() === 'textract';
const textract = TEXTRACT_ENABLED
  ? new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

console.log(`[bookings] Textract verification ${TEXTRACT_ENABLED ? 'ENABLED' : 'DISABLED'}`);

/* ---------------------- Multer ---------------------- */
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'licenseFile', maxCount: 1 },
  { name: 'passportFile', maxCount: 1 },
]);

/* ---------------------- Pricing ---------------------- */
const bikePricing = {
  'Honda CB650R E-Clutch': { perDay: 500, perWeek: 3200, perMonth: 9800 },
  'Harley Davidson Fat Boy 2021': { perDay: 600, perWeek: 3900, perMonth: 10500 },
  'Harley Davidson Fat Boy 1990': { perDay: 450, perWeek: 3000, perMonth: 9000 },
};

const calculatePrice = (days, insurance, bike) => {
  const p = bikePricing[bike];
  if (!p) return 0;

  let total = 0;
  let remaining = days;

  const months = Math.floor(remaining / 30);
  total += months * p.perMonth;
  remaining -= months * 30;

  const weeks = Math.floor(remaining / 7);
  total += weeks * p.perWeek;
  remaining -= weeks * 7;

  total += remaining * p.perDay;
  total += days * 50; // base surcharge
  if (insurance === 'true' || insurance === true) total += days * 50;

  return total;
};

/* ---------------------- S3 helpers ---------------------- */
const uploadToS3 = async (file, firstName, lastName, type) => {
  const extension = mime.extension(file.mimetype) || 'jpg';
  const key = `${firstName}-${lastName}-${type}-${Date.now()}.${extension}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );
  return key;
};

const signUrl = async (key) => {
  const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: 3600 });
};

/* ---------------------- Enrich bookings for UI ---------------------- */
async function enrichBookings(bookings) {
  const bikes = await Bike.find();
  const bikeMap = {};
  bikes.forEach((b) => {
    bikeMap[`${b.name} ${b.modelYear}`.trim()] = b;
  });

  return Promise.all(
    bookings.map(async (b) => {
      const result = { ...b.toObject() };
      if (b.licenseFileUrl)  result.licenseSignedUrl  = await signUrl(b.licenseFileUrl);
      if (b.passportFileUrl) result.passportSignedUrl = await signUrl(b.passportFileUrl);

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
}

/* ---------------------- Textract helpers ---------------------- */
// AnalyzeID expects pages as { S3Object: { Bucket, Name } }
async function analyzeIdFromS3Key(key) {
  if (!textract) throw new Error('Textract disabled');
  const input = {
    DocumentPages: [{ S3Object: { Bucket: process.env.AWS_S3_BUCKET, Name: key } }],
  };
  const cmd = new AnalyzeIDCommand(input);
  return await textract.send(cmd);
}

// OCR fallback (lines)
async function detectTextLinesFromS3Key(key) {
  const out = await textract.send(
    new DetectDocumentTextCommand({
      Document: { S3Object: { Bucket: process.env.AWS_S3_BUCKET, Name: key } },
    })
  );
  return (out.Blocks || [])
    .filter(b => b.BlockType === 'LINE')
    .map(b => (b.Text || '').trim())
    .filter(Boolean);
}

function normalizeName(s) {
  return (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function pickField(fields, ...types) {
  const set = new Set(types.map(t => String(t).toUpperCase()));
  for (const f of fields || []) {
    const k = String(f?.Type?.Text || '').toUpperCase();
    if (set.has(k)) return (f?.ValueDetection?.Text || '').trim();
  }
  return '';
}

/** Prefer structured AnalyzeID fields; soft-check name and expiry. */
function evaluateDocFromAnalyzeID(fields, expectedName) {
  // Common AnalyzeID types:
  // FIRST_NAME, GIVEN_NAME(S), LAST_NAME, SURNAME, FULL_NAME, EXPIRATION_DATE/DATE_OF_EXPIRY/etc.
  const first = pickField(fields, 'FIRST_NAME', 'GIVEN_NAME', 'GIVEN_NAMES');
  const last  = pickField(fields, 'LAST_NAME', 'SURNAME');
  const full  = (first || last) ? `${first} ${last}`.trim()
                                : pickField(fields, 'FULL_NAME', 'NAME');

  const expiryRaw = pickField(
    fields,
    'EXPIRATION_DATE', 'DATE_OF_EXPIRY', 'EXPIRY_DATE', 'VALID_UNTIL'
  );

  let notExpired = true;
  if (expiryRaw) {
    const d = new Date(expiryRaw);
    if (!isNaN(d)) notExpired = d >= new Date();
  }

  const exp = normalizeName(expectedName);
  const act = normalizeName(full);
  const firstToken = exp.split(' ')[0] || '';
  const nameOk = firstToken ? act.includes(firstToken) : !!act;

  const status = nameOk && notExpired ? 'passed' : 'failed';
  const reason = !act
    ? 'No name found'
    : !nameOk
      ? `Name mismatch. expected~"${expectedName.toLowerCase()}", got~"${full || 'N/A'}"`
      : !notExpired
        ? 'Document expired'
        : 'OK';

  return {
    status,
    reason,
    extractedName: full || '',
    fields: (fields || []).map(f => ({ type: f?.Type?.Text, value: f?.ValueDetection?.Text })),
  };
}

/** Very light OCR fallback: join lines and check name token presence. */
function evaluateDocFromOCR(lines, expectedName) {
  const exp = normalizeName(expectedName);
  const joined = lines.join(' ').replace(/\s+/g, ' ').trim();
  const ok = exp ? normalizeName(joined).includes(exp.split(' ')[0]) : false;

  return {
    status: ok ? 'passed' : 'failed',
    reason: ok ? 'OK (OCR fallback)' : `Name mismatch (OCR). expected~"${exp}", got~"N/A"`,
    ocrPreview: joined.slice(0, 200) + (joined.length > 200 ? '…' : ''),
  };
}

/** Run Textract after save, store detailed reasons, and roll up overall status. */
async function scheduleVerification(saved) {
  if (!textract) {
    console.log('[verify] skipped: textract disabled');
    return;
  }

  setImmediate(async () => {
    try {
      console.log('[verify] start booking=%s', saved._id);
      const expectedName = `${saved.firstName} ${saved.lastName}`.trim();
      const updates = { 'verification.updatedAt': new Date() };

      const runOne = async (label, key) => {
        if (!key) return { status: 'skipped', reason: 'No file' };
        try {
          const out = await analyzeIdFromS3Key(key);
          if (process.env.DEBUG_TEXTRACT === '1') {
            console.log(`[verify] ${label} raw AnalyzeID:`, JSON.stringify(out, null, 2));
          }
          const fields = out.IdentityDocuments?.[0]?.IdentityDocumentFields || [];
          let result = evaluateDocFromAnalyzeID(fields, expectedName);

          // Fallback to OCR only to rescue a "No name/mismatch"
          if (result.status === 'failed' && /No name|mismatch/i.test(result.reason)) {
            const lines = await detectTextLinesFromS3Key(key);
            if (process.env.DEBUG_TEXTRACT === '1') {
              console.log(`[verify] ${label} OCR lines:`, lines);
            }
            const ocrRes = evaluateDocFromOCR(lines, expectedName);
            if (ocrRes.status === 'passed') result = ocrRes;
          }

          console.log('[verify] %s booking=%s status=%s reason=%s', label, saved._id, result.status, result.reason);
          return result;
        } catch (e) {
          console.warn('[verify] %s error booking=%s %s', label, saved._id, e.message);
          return { status: 'failed', reason: `Textract error` };
        }
      };

      const lic = await runOne('license',  saved.licenseFileUrl);
      const pas = await runOne('passport', saved.passportFileUrl);

      updates['verification.license']  = lic;
      updates['verification.passport'] = pas;
      updates['verification.status'] =
        lic.status === 'passed' && pas.status === 'passed'
          ? 'passed'
          : (lic.status === 'failed' || pas.status === 'failed')
          ? 'failed'
          : (lic.status === 'skipped' && pas.status === 'skipped')
          ? 'skipped'
          : 'pending';

      await Booking.findByIdAndUpdate(saved._id, { $set: updates });
      console.log('[verify] done booking=%s status=%s', saved._id, updates['verification.status']);
    } catch (e) {
      console.error('[verify] fatal booking=%s %s', saved._id, e.message);
    }
  });
}

/* ---------------------- Routes ---------------------- */

// Public/admin list
router.get('/', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(await enrichBookings(bookings));
  } catch (err) {
    console.error('Failed to get bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Mine (requires auth)
router.get('/mine', auth, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ error: 'User email missing in token' });

    const bookings = await Booking.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(await enrichBookings(bookings));
  } catch (err) {
    console.error('Failed to get my bookings:', err);
    res.status(500).json({ error: 'Failed to fetch my bookings' });
  }
});

// Poll a single booking's verification (owner/admin)
router.get('/:id/verification', auth, async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    const isOwner = String(b.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    res.json(b.verification || { status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
});

// Create (requires auth + consent)
router.post('/', auth, upload, async (req, res) => {
  try {
    const {
      firstName, lastName, startDateTime, numberOfDays, bike,
      insurance, provideDocsInOffice, consentGiven, consentTextVersion, dataRetentionDays,
    } = req.body;

    if (!req.user?.email) return res.status(401).json({ error: 'Unauthorized' });
    if (!['true', true, '1', 1].includes(consentGiven)) {
      return res.status(400).json({ error: 'Consent is required to submit booking' });
    }

    const days = parseInt(numberOfDays, 10);
    const start = new Date(startDateTime);
    const end   = new Date(start);
    end.setDate(start.getDate() + days);

    const licenseKey = req.files.licenseFile
      ? await uploadToS3(req.files.licenseFile[0], firstName, lastName, 'License')
      : null;

    const passportKey = req.files.passportFile
      ? await uploadToS3(req.files.passportFile[0], firstName, lastName, 'Passport')
      : null;

    const totalPrice = calculatePrice(days, insurance, bike);

    // Init verification
    let verification = {
      status: 'pending',
      license:  { status: licenseKey  ? 'pending' : 'skipped' },
      passport: { status: passportKey ? 'pending' : 'skipped' },
      updatedAt: new Date(),
      log: [],
    };

    if (provideDocsInOffice === 'true' || provideDocsInOffice === true) {
      verification = {
        status: 'skipped',
        license:  { status: 'skipped' },
        passport: { status: 'skipped' },
        updatedAt: new Date(),
        log: [{ message: 'Verification skipped (docs in office)' }],
      };
    }

    const saved = await new Booking({
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
      consentGiven: true,
      consentTextVersion: consentTextVersion || 'v1',
      dataRetentionDays: parseInt(dataRetentionDays || 90, 10),
      verification,
    }).save();

    if (TEXTRACT_ENABLED && !['true', true, '1', 1].includes(provideDocsInOffice) && (licenseKey || passportKey)) {
      scheduleVerification(saved).catch((e) => console.error('scheduleVerification error:', e));
    }

    res.json(saved);
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Booking creation failed' });
  }
});

/* ---------------------- Admin: reverify + override + delete ---------------------- */
function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin only' });
}

// Admin-triggered reverify
router.post('/:id/reverify', auth, requireAdmin, async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    if (!TEXTRACT_ENABLED) return res.status(400).json({ error: 'Textract disabled' });

    b.verification = {
      status: 'pending',
      license:  { status: b.licenseFileUrl  ? 'pending' : 'skipped' },
      passport: { status: b.passportFileUrl ? 'pending' : 'skipped' },
      updatedAt: new Date(),
      log: (b.verification?.log || []).concat([{ message: 'Reverify requested by admin' }]),
    };
    await b.save();

    scheduleVerification(b).catch((e) => console.error('reverify error:', e));
    res.json({ ok: true });
  } catch (err) {
    console.error('reverify error:', err);
    res.status(500).json({ error: 'Failed to reverify' });
  }
});

// Admin override
router.patch('/:id/verification', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, license, passport, message } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (status)   booking.verification.status   = status;
    if (license)  booking.verification.license  = { ...booking.verification.license,  ...license  };
    if (passport) booking.verification.passport = { ...booking.verification.passport, ...passport };
    if (message)  booking.verification.log.push({ message });

    booking.verification.updatedAt = new Date();
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error('Verification update error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// Owner or admin can delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });

    const isOwner = String(b.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await b.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;