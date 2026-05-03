const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: null // Custom name by owner
  },
  coordinates: {
    type: [[Number]], // Array of [lng, lat] pairs forming polygon
    required: true
  },
  area: {
    type: Number,
    required: true // in square meters
  },
  color: {
    type: String,
    default: '#00ff88'
  },
  center: {
    lat: Number,
    lng: Number
  },
  capturedAt: {
    type: Date,
    default: Date.now
  },
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Run'
  }
}, {
  timestamps: true
});

// Geo index for map queries
territorySchema.index({ center: '2dsphere' });

module.exports = mongoose.model('Territory', territorySchema);
