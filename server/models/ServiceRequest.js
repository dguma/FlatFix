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
    enum: ['air-inflation', 'spare-replacement', 'shop-pickup'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  images: [String], // URLs to uploaded images
  pricing: {
    baseFee: {
      type: Number,
      default: 20.00
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  estimatedArrival: Date,
  actualArrival: Date,
  completedAt: Date,
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  technicianRating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  tracking: {
    startedAt: Date,
    arrivedAt: Date,
    completedAt: Date,
    totalDistanceMiles: {
      type: Number,
      default: 0
    },
    totalTimeMinutes: {
      type: Number,
      default: 0
    },
    technicianStartLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    locationHistory: [{
      latitude: Number,
      longitude: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    isTracking: {
      type: Boolean,
      default: false
    },
    jobStartTime: Date,
    jobEndTime: Date,
    jobDurationMinutes: {
      type: Number,
      default: 0
    }
  },
  chat: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['customer', 'technician'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  customerCarInfo: {
    make: String,
    model: String,
    year: String,
    color: String,
    licensePlate: String,
    additionalInfo: String
  },
  confirmations: {
    customerConfirmedArrival: {
      type: Boolean,
      default: false
    },
    customerConfirmedCompletion: {
      type: Boolean,
      default: false
    },
    technicianConfirmedCompletion: {
      type: Boolean,
      default: false
    },
    arrivalConfirmedAt: Date,
    completionConfirmedAt: Date
  },
  reviews: {
    customerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      reviewedAt: Date
    },
    technicianReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      reviewedAt: Date
    }
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'technician', 'system']
    },
    reason: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Index for geospatial queries
serviceRequestSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
