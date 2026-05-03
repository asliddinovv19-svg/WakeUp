const mongoose = require('mongoose');

const runSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  path: {
    type: [[Number]], // Array of [lng, lat] waypoints
    required: true
  },
  distance: {
    type: Number,
    required: true // meters
  },
  duration: {
    type: Number,
    required: true // seconds
  },
  area: {
    type: Number,
    default: 0 // square meters of territory captured
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  averagePace: {
    type: Number,
    default: 0 // min/km
  },
  territoryCaptured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Run', runSchema);
