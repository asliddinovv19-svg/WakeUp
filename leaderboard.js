const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/leaderboard?period=weekly|monthly|yearly|all
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;

    let sortField = 'totalArea';
    if (period === 'weekly') sortField = 'weeklyArea';
    else if (period === 'monthly') sortField = 'monthlyArea';
    else if (period === 'yearly') sortField = 'yearlyArea';

    const users = await User.find({ isVerified: true, [sortField]: { $gt: 0 } })
      .select(`username avatar city country ${sortField} totalRuns totalDistance`)
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    // Add rank
    const ranked = users.map((u, idx) => ({
      rank: idx + 1,
      id: u._id,
      username: u.username,
      avatar: u.avatar,
      city: u.city,
      country: u.country,
      area: u[sortField],
      totalRuns: u.totalRuns,
      totalDistance: u.totalDistance
    }));

    // Find current user's rank
    const myRank = ranked.findIndex(u => u.id.toString() === req.user._id.toString());

    res.json({ 
      leaderboard: ranked,
      period,
      myRank: myRank >= 0 ? myRank + 1 : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
