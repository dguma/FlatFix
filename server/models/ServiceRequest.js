const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  serviceType: {
    type: String,
    enum: ['air-inflation', 'spare-replacement', 'shop-pickup', 'lockout', 'jumpstart', 'fuel-delivery'],
    required: true
  },
  pricing: {
    base: { type: Number },
    service: { type: Number },
  perUnit: { type: Number }, // e.g., per gallon
  maxUnits: { type: Number },
  perMile: { type: Number },
  estimatedMiles: { type: Number },
  estimate: { type: Number },
  currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  location: {
    address: {
      type: String,
      required: true
  },
  latitude: { type: Number },
  longitude: { type: Number }
  },
  description: {
    type: String,
    required: true
  },
  selectedShop: {
    name: { type: String },
    phone: { type: String },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    distanceMiles: { type: Number }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
