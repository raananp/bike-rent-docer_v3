// backend/routes/stats.js
const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const auth = require('../middleware/auth');

const router = express.Router();

// Optional: only allow admins
function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin only' });
}

/**
 * GET /api/stats
 * Returns:
 * {
 *   totalBookings,
 *   activeBookings,
 *   totalRevenue,
 *   profitByBike: [{ label, bookings, revenue }],
 *   latestBookings: [{ _id, bikeLabel, totalPrice, startDateTime, endDateTime }]
 * }
 */
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const now = new Date();

    const [counters] = await Booking.aggregate([
      {
        $facet: {
          totalBookings: [{ $count: 'n' }],
          activeBookings: [
            { $match: { startDateTime: { $lte: now }, endDateTime: { $gte: now } } },
            { $count: 'n' }
          ],
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: '$totalPrice' } } }
          ]
        }
      },
      {
        $project: {
          totalBookings: { $ifNull: [{ $arrayElemAt: ['$totalBookings.n', 0] }, 0] },
          activeBookings: { $ifNull: [{ $arrayElemAt: ['$activeBookings.n', 0] }, 0] },
          totalRevenue: { $ifNull: [{ $arrayElemAt: ['$totalRevenue.sum', 0] }, 0] },
        }
      }
    ]);

    // PROFIT BY BIKE — robust normalization:
    // - If booking.bike is ObjectId-like, join by _id
    // - Else, treat as "Name Model" string and match against bikes.name + " " + bikes.modelYear
    const profitRows = await Booking.aggregate([
      {
        $addFields: {
          bikeStr: { $toString: '$bike' },
          isObjIdLike: {
            $regexMatch: { input: { $toString: '$bike' }, regex: /^[a-f0-9]{24}$/ }
          }
        }
      },
      {
        $addFields: {
          bikeObjectId: {
            $cond: [{ $eq: ['$isObjIdLike', true] }, { $toObjectId: '$bikeStr' }, null]
          },
          bikeString: {
            $cond: [{ $eq: ['$isObjIdLike', true] }, null, '$bike' ]
          }
        }
      },
      // Join by _id (when saved as ObjectId)
      {
        $lookup: {
          from: 'bikes',
          localField: 'bikeObjectId',
          foreignField: '_id',
          as: 'matchById'
        }
      },
      // Join by "Name Model" string (when saved as string)
      {
        $lookup: {
          from: 'bikes',
          let: { s: '$bikeString' },
          pipeline: [
            { $addFields: { displayName: { $concat: ['$name', ' ', '$modelYear'] } } },
            { $match: { $expr: { $eq: ['$displayName', '$$s'] } } }
          ],
          as: 'matchByString'
        }
      },
      {
        $addFields: {
          resolvedLabel: {
            $ifNull: [
              { $arrayElemAt: ['$matchById.displayName', 0] },
              { $arrayElemAt: ['$matchByString.displayName', 0] }
            ]
          }
        }
      },
      // Fallback to whatever was saved
      {
        $addFields: {
          resolvedLabel: { $ifNull: ['$resolvedLabel', '$bike'] }
        }
      },
      {
        $group: {
          _id: '$resolvedLabel',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          label: '$_id',
          bookings: 1,
          revenue: 1
        }
      }
    ]);

    // small “latest bookings” panel if you want it
    const latest = await Booking.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 6 },
      {
        $addFields: {
          bikeStr: { $toString: '$bike' },
          isObjIdLike: {
            $regexMatch: { input: { $toString: '$bike' }, regex: /^[a-f0-9]{24}$/ }
          }
        }
      },
      {
        $addFields: {
          bikeObjectId: {
            $cond: [{ $eq: ['$isObjIdLike', true] }, { $toObjectId: '$bikeStr' }, null]
          },
          bikeString: {
            $cond: [{ $eq: ['$isObjIdLike', true] }, null, '$bike' ]
          }
        }
      },
      {
        $lookup: {
          from: 'bikes',
          localField: 'bikeObjectId',
          foreignField: '_id',
          as: 'matchById'
        }
      },
      {
        $lookup: {
          from: 'bikes',
          let: { s: '$bikeString' },
          pipeline: [
            { $addFields: { displayName: { $concat: ['$name', ' ', '$modelYear'] } } },
            { $match: { $expr: { $eq: ['$displayName', '$$s'] } } }
          ],
          as: 'matchByString'
        }
      },
      {
        $addFields: {
          bikeLabel: {
            $ifNull: [
              { $arrayElemAt: ['$matchById.displayName', 0] },
              { $arrayElemAt: ['$matchByString.displayName', 0] },
              '$bike'
            ]
          }
        }
      },
      {
        $project: {
          bikeLabel: 1, totalPrice: 1, startDateTime: 1, endDateTime: 1
        }
      }
    ]);

    res.json({
      totalBookings: counters?.totalBookings || 0,
      activeBookings: counters?.activeBookings || 0,
      totalProfit: counters?.totalRevenue || 0,
      profitByBike: profitRows,
      latestBookings: latest
    });
  } catch (e) {
    console.error('stats error:', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;