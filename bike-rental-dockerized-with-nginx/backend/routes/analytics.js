// backend/routes/analytics.js
const express = require('express');
const AnalyticsEvent = require('../models/AnalyticsEvent');

const router = express.Router();

// helper to read IP safely (trust proxy is set in server.js)
function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
         req.socket?.remoteAddress ||
         '';
}

/**
 * POST /api/analytics/track
 * Accepts application/json (works with sendBeacon Blob + fetch).
 * Responds fast with 204 so it never blocks navigation.
 */
router.post('/track', express.json({ limit: '64kb' }), async (req, res) => {
  try {
    const { type, sessionId, path, bikeId, bikeName, meta } = req.body || {};
    if (!type || !sessionId) return res.status(400).json({ error: 'type and sessionId required' });

    await AnalyticsEvent.create({
      type,
      sessionId,
      path,
      bikeId,
      bikeName,
      meta: typeof meta === 'object' && meta ? meta : {},
      ua: req.headers['user-agent'] || '',
      ip: getIp(req),
    });

    // sendBeacon expects a tiny, fast response
    res.status(204).end();
  } catch (e) {
    console.error('[analytics] track', e);
    // Still return 204 so the browser doesn't retry
    res.status(204).end();
  }
});

/**
 * GET /api/analytics/summary
 * Public or protect with admin middleware if you prefer.
 */
router.get('/summary', async (_req, res) => {
  try {
    const [{ totalPageViews = 0 } = {}] = await AnalyticsEvent.aggregate([
      { $match: { type: 'page_view' } },
      { $count: 'totalPageViews' },
    ]);

    const [{ uniqueVisitors = 0 } = {}] = await AnalyticsEvent.aggregate([
      { $match: { type: 'page_view' } },
      { $group: { _id: '$sessionId' } },
      { $count: 'uniqueVisitors' },
    ]);

    const topBikes = await AnalyticsEvent.aggregate([
      { $match: { type: 'bike_open' } },
      { $group: { _id: { bikeId: '$bikeId', bikeName: '$bikeName' }, opens: { $sum: 1 } } },
      { $sort: { opens: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, bikeId: '$_id.bikeId', bikeName: '$_id.bikeName', opens: 1 } },
    ]);

    res.json({ totalPageViews, uniqueVisitors, topBikes });
  } catch (e) {
    console.error('[analytics] summary', e);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;