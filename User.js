const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  city: {
    type: String,
    default: ''
  },
  region: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationExpires: {
    type: Date,
    default: null
  },
  totalArea: {
    type: Number,
    default: 0 // in square meters
  },
  weeklyArea: {
    type: Number,
    default: 0
  },
  monthlyArea: {
    type: Number,
    default: 0
  },
  yearlyArea: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0 // in meters
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'uz'],
    default: 'uz'
  },
  lastWeekReset: {
    type: Date,
    default: Date.now
  },
  lastMonthReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
