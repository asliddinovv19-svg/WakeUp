const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Run = require('../models/Run');
const Territory = require('../models/Territory');

// Multer setup for avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// GET /api/user/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationCode');
    const runs = await Run.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    const territories = await Territory.find({ owner: req.user._id });
    
    res.json({ user, runs, territoriesCount: territories.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, city, region, country, language } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (city !== undefined) updates.city = city;
    if (region !== undefined) updates.region = region;
    if (country !== undefined) updates.country = country;
    if (language !== undefined) updates.language = language;

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: updates }, 
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    
    res.json({ message: 'Avatar updated', avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/run - Save a run
router.post('/run', auth, async (req, res) => {
  try {
    const { path: runPath, distance, duration, area, startTime, endTime } = req.body;

    if (!runPath || runPath.length < 3) {
      return res.status(400).json({ message: 'Invalid run path' });
    }

    const avgPace = duration > 0 ? (duration / 60) / (distance / 1000) : 0;

    const run = new Run({
      user: req.user._id,
      path: runPath,
      distance,
      duration,
      area: area || 0,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      averagePace: avgPace,
      territoryCaptured: area > 0
    });

    await run.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalDistance: distance,
        totalRuns: 1,
        totalArea: area || 0,
        weeklyArea: area || 0,
        monthlyArea: area || 0,
        yearlyArea: area || 0
      }
    });

    res.json({ message: 'Run saved!', run });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/:id - Public profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar bio city country totalArea totalRuns totalDistance createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
