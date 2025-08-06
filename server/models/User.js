const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  userType: {
    type: String,
    enum: ['customer', 'technician'],
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  // Technician specific fields
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String
  },
  // Customer specific fields
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'paypal']
    },
    last4: String,
    isDefault: Boolean
  }],
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpiry: Date
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
