const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Use "name" to match routes/auth.js
  name: {
    type: String,
    required: true,
  applicationStatus: { type: String, enum: ['pending','waitlisted','approved','rejected','needs-info'], default: 'pending' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechApplication' },
  orientation: {
    startedAt: { type: Date },
    completedAt: { type: Date },
    currentSlide: { type: Number, default: 0 },
    totalSlides: { type: Number, default: 0 },
    progress: { type: Number, default: 0 }
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  onboardingComplete: { type: Boolean, default: false },
  waitlistPosition: { type: Number },
  stats: {
    jobsCompleted: { type: Number, default: 0 },
    earningsCents: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 }
  },
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
  required: false
  },
  // Use userType to match routes/auth.js and downstream role checks
  userType: {
    type: String,
    enum: ['customer', 'technician', 'admin'],
    default: 'customer'
  },
  // Technician-specific fields
  isAvailable: {
    type: Boolean,
    default: false
  },
  vehicleInfo: {
    make: { type: String },
    model: { type: String },
  year: { type: String },
    licensePlate: { type: String }
  },
  // Profile avatar (small images / data URL or hosted link)
  avatarUrl: { type: String },
  // Equipment a technician has on-hand to unlock additional service types
  equipment: {
    lockoutKit: { type: Boolean, default: false },
    jumpStarter: { type: Boolean, default: false },
    fuelCan: { type: Boolean, default: false }
  },
  // Technician application / onboarding fields
  applicationStatus: { type: String, enum: ['pending','waitlisted','approved','rejected','needs-info'], default: 'pending' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechApplication' },
  orientation: {
    startedAt: { type: Date },
    completedAt: { type: Date },
    currentSlide: { type: Number, default: 0 },
    totalSlides: { type: Number, default: 0 },
    progress: { type: Number, default: 0 } // 0-100
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  onboardingComplete: { type: Boolean, default: false },
  waitlistPosition: { type: Number },
  // Basic aggregates for dashboard (can be recomputed periodically)
  stats: {
    jobsCompleted: { type: Number, default: 0 },
    earningsCents: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 }
  },
  // Optional location (populated when user shares GPS). Not indexed yet; add geo index later if needed.
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
