const mongoose = require('mongoose');

const techApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  experienceYears: { type: Number, default: 0 },
  hasCommercialInsurance: { type: Boolean, default: false },
  vehicle: { make: String, model: String, year: String, licensePlate: String },
  equipmentOwned: {
    lockoutKit: { type: Boolean, default: false },
    jumpStarter: { type: Boolean, default: false },
    fuelCan: { type: Boolean, default: false },
    torqueWrench: { type: Boolean, default: false },
    impactGun: { type: Boolean, default: false }
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  orientationRequired: { type: Boolean, default: true },
  orientationCompleted: { type: Boolean, default: false },
  status: { type: String, enum: ['pending','waitlisted','approved','rejected','needs-info'], default: 'pending' },
  notes: [{ body: String, at: { type: Date, default: Date.now }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  metadata: { type: Object },
  waitlistedAt: { type: Date },
  reviewedAt: { type: Date },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TechApplication', techApplicationSchema);
