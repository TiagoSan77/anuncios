const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    default: 'Dispositivo Móvel'
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    default: 'android'
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

deviceSchema.index({ userId: 1, lastSync: -1 });
deviceSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Device', deviceSchema);
