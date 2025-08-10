// backend/services/verification.js
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');

const textract = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// quick MRZ regex (passport lines) – very permissive on purpose
const MRZ_REGEX = /P<[\w<]{2,}/i;

// basic license keywords we often see (EN + generic)
const LICENSE_HINTS = [
  'DRIVER LICENSE', 'DRIVING LICENSE', 'DRIVER’S LICENSE', 'INTERNATIONAL DRIVING PERMIT',
  'DL', 'LICENCE', 'LICENSE NO', 'ISSUE DATE', 'EXPIRY DATE'
];

// basic passport keywords we often see (EN generic)
const PASSPORT_HINTS = [
  'PASSPORT', 'PASSPORT NO', 'COUNTRY', 'NATIONALITY', 'DATE OF BIRTH', 'PLACE OF BIRTH'
];

/**
 * Run Textract on an S3 image and return the extracted full text.
 */
async function ocrS3Image({ bucket, key }) {
  const cmd = new DetectDocumentTextCommand({
    Document: { S3Object: { Bucket: bucket, Name: key } },
  });
  const out = await textract.send(cmd);
  const lines = (out.Blocks || [])
    .filter(b => b.BlockType === 'LINE' && b.Text)
    .map(b => b.Text);
  return lines.join('\n');
}

/**
 * Heuristic classification.
 */
function classify(text, kind /* 'passport' | 'license' */) {
  const t = text.toUpperCase();

  if (kind === 'passport') {
    const hasMrz = MRZ_REGEX.test(text);
    const hits = PASSPORT_HINTS.filter(h => t.includes(h)).length;
    if (hasMrz || hits >= 2) {
      return { status: 'passed', details: `hits=${hits}, mrz=${hasMrz}` };
    }
    return { status: 'failed', details: `hits=${hits}, mrz=${hasMrz}` };
  }

  if (kind === 'license') {
    const hits = LICENSE_HINTS.filter(h => t.includes(h)).length;
    // A very soft rule (tune later)
    if (hits >= 2) {
      return { status: 'passed', details: `hits=${hits}` };
    }
    return { status: 'failed', details: `hits=${hits}` };
  }

  return { status: 'failed', details: 'unknown kind' };
}

/**
 * Public API
 */
async function verifyPassport({ bucket, key }) {
  const text = await ocrS3Image({ bucket, key });
  const result = classify(text, 'passport');
  return { ...result, checkedAt: new Date() };
}

async function verifyLicense({ bucket, key }) {
  const text = await ocrS3Image({ bucket, key });
  const result = classify(text, 'license');
  return { ...result, checkedAt: new Date() };
}

module.exports = {
  verifyPassport,
  verifyLicense,
};