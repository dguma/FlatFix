const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Use "name" to match routes/auth.js
  name: {
    type: String,
    required: true,
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
    required: true
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
    licensePlate: { type: String }
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
