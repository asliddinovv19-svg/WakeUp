const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Territory = require('../models/Territory');
const User = require('../models/User');

// GET /api/map/territories - Get all territories (for map display)
router.get('/territories', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters

    const territories = await Territory.find()
      .populate('owner', 'username avatar')
      .lean();

    res.json({ territories });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/map/territory - Create/capture territory
router.post('/territory', auth, async (req, res) => {
  try {
    const { coordinates, area, center, color } = req.body;

    if (!coordinates || coordinates.length < 3) {
      return res.status(400).json({ message: 'Need at least 3 coordinate points' });
    }

    if (area < 100) {
      return res.status(400).json({ message: 'Territory too small (min 100 sq meters)' });
    }

    // Create territory
    const territory = new Territory({
      owner: req.user._id,
      coordinates,
      area,
      center,
      color: color || '#00ff88'
    });

    await territory.save();

    // Update user area stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalArea: area,
        weeklyArea: area,
        monthlyArea: area,
        yearlyArea: area
      }
    });

    await territory.populate('owner', 'username avatar');

    res.json({ message: 'Territory captured!', territory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/map/territory/:id/name - Rename territory
router.put('/territory/:id/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const territory = await Territory.findById(req.params.id);

    if (!territory) return res.status(404).json({ message: 'Territory not found' });
    if (territory.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your territory' });
    }

    territory.name = name;
    await territory.save();

    res.json({ message: 'Territory renamed!', territory });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/map/my-territories
router.get('/my-territories', auth, async (req, res) => {
  try {
    const territories = await Territory.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ territories });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
