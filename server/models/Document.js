const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'TechApplication' },
  type: { type: String, enum: ['drivers_license','vehicle_registration','insurance_proof','background_check','other'], required: true },
  originalName: { type: String },
  mimeType: { type: String },
  sizeBytes: { type: Number },
  storageKey: { type: String },
  status: { type: String, enum: ['uploaded','approved','rejected','expired','pending-review'], default: 'uploaded' },
  statusNote: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
