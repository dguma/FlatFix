const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token (same as in auth.js)
const jwt = require('jsonwebtoken');
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Create a new service request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { serviceType, location, description, images } = req.body;

    // Calculate pricing based on service type
    let serviceFee = 0;
    switch (serviceType) {
      case 'air-inflation':
        serviceFee = 0; // Only base fee
        break;
      case 'spare-replacement':
        serviceFee = 15; // Additional fee for replacement
        break;
      case 'shop-pickup':
        serviceFee = 25; // Additional fee for shop coordination
        break;
    }

    const totalAmount = 20 + serviceFee; // Base fee + service fee

    const serviceRequest = new ServiceRequest({
      customerId: req.user.userId,
      serviceType,
      location,
      description,
      images: images || [],
      pricing: {
        baseFee: 20,
        serviceFee,
        totalAmount
      }
    });

    await serviceRequest.save();

    res.status(201).json({
      message: 'Service request created successfully',
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service request', error: error.message });
  }
});

// Get service requests for technicians (available jobs)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const availableRequests = await ServiceRequest.find({ status: 'pending' })
      .populate('customerId', 'name phone location')
      .sort({ createdAt: -1 });

    res.json(availableRequests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get available requests', error: error.message });
  }
});

// Claim a service request
router.post('/claim/:requestId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Service request is no longer available' });
    }

    // Update request with technician
    serviceRequest.technicianId = req.user.userId;
    serviceRequest.status = 'assigned';
    serviceRequest.estimatedArrival = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    await serviceRequest.save();
    console.log(`Service request ${serviceRequest._id} claimed by technician ${req.user.userId}`);

    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customerId', 'name phone')
      .populate('technicianId', 'name phone vehicleInfo rating');

    res.json({
      message: 'Service request claimed successfully',
      serviceRequest: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to claim request', error: error.message });
  }
});

// Get customer's service requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    const requests = await ServiceRequest.find({ customerId: req.user.userId })
      .populate('technicianId', 'name phone vehicleInfo rating')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get requests', error: error.message });
  }
});

// Get technician's assigned jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const jobs = await ServiceRequest.find({ 
      technicianId: req.user.userId,
      status: { $in: ['assigned', 'in-progress', 'completed'] }
    })
      .populate('customerId', 'name phone location')
      .sort({ createdAt: -1 });

    console.log(`Found ${jobs.length} jobs for technician ${req.user.userId}`);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get jobs', error: error.message });
  }
});

// Update service status
router.patch('/status/:requestId', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const serviceRequest = await ServiceRequest.findById(req.params.requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    if (req.user.userType === 'technician' && serviceRequest.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.userType === 'customer' && serviceRequest.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    serviceRequest.status = status;
    if (notes) serviceRequest.notes = notes;
    
    if (status === 'in-progress') {
      serviceRequest.actualArrival = new Date();
    } else if (status === 'completed') {
      serviceRequest.completedAt = new Date();
    }

    await serviceRequest.save();

    res.json({
      message: 'Service status updated successfully',
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

// Update tracking information
router.patch('/tracking/:requestId', authenticateToken, async (req, res) => {
  try {
    const { tracking, status } = req.body;
    const serviceRequest = await ServiceRequest.findById(req.params.requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization - only technician can update tracking
    if (req.user.userType !== 'technician' || serviceRequest.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update status if provided
    if (status) {
      serviceRequest.status = status;
    }

    // Initialize tracking if it doesn't exist
    if (!serviceRequest.tracking) {
      serviceRequest.tracking = {
        totalDistanceMiles: 0,
        totalTimeMinutes: 0,
        locationHistory: [],
        isTracking: false
      };
    }

    // Update tracking fields
    if (tracking.startedAt) {
      serviceRequest.tracking.startedAt = new Date(tracking.startedAt);
      serviceRequest.tracking.isTracking = true;
    }

    if (tracking.arrivedAt) {
      serviceRequest.tracking.arrivedAt = new Date(tracking.arrivedAt);
      serviceRequest.tracking.isTracking = false;
    }

    if (tracking.completedAt) {
      serviceRequest.tracking.completedAt = new Date(tracking.completedAt);
      serviceRequest.tracking.isTracking = false;
      serviceRequest.completedAt = new Date(tracking.completedAt);
    }

    if (tracking.technicianStartLocation) {
      serviceRequest.tracking.technicianStartLocation = tracking.technicianStartLocation;
    }

    if (tracking.locationHistory) {
      serviceRequest.tracking.locationHistory.push({
        latitude: tracking.locationHistory.latitude,
        longitude: tracking.locationHistory.longitude,
        timestamp: new Date(tracking.locationHistory.timestamp || Date.now())
      });
    }

    if (typeof tracking.totalDistanceMiles === 'number') {
      serviceRequest.tracking.totalDistanceMiles = tracking.totalDistanceMiles;
    }

    if (typeof tracking.totalTimeMinutes === 'number') {
      serviceRequest.tracking.totalTimeMinutes = tracking.totalTimeMinutes;
    }

    if (typeof tracking.isTracking === 'boolean') {
      serviceRequest.tracking.isTracking = tracking.isTracking;
    }

    await serviceRequest.save();

    res.json({ message: 'Tracking updated successfully', serviceRequest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tracking', error: error.message });
  }
});

// Get job tracking details
router.get('/tracking/:requestId', authenticateToken, async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.requestId)
      .populate('customerId', 'name phone')
      .populate('technicianId', 'name phone vehicleInfo');

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    const isCustomer = req.user.userType === 'customer' && serviceRequest.customerId._id.toString() === req.user.userId;
    const isTechnician = req.user.userType === 'technician' && serviceRequest.technicianId && serviceRequest.technicianId._id.toString() === req.user.userId;

    if (!isCustomer && !isTechnician) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(serviceRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get tracking details', error: error.message });
  }
});

// Accept job (technician)
router.post('/accept/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    // Assign technician
    request.technicianId = req.user.userId;
    request.status = 'assigned';
    await request.save();

    // Populate technician info for response
    await request.populate('technicianId', 'name phone email vehicleInfo');

    // Emit socket event to notify customer
    const io = req.app.get('io');
    if (io) {
      io.emit('technician-assigned', {
        requestId: request._id,
        customerId: request.customerId,
        technician: {
          id: request.technicianId._id,
          name: request.technicianId.name,
          phone: request.technicianId.phone,
          vehicleInfo: request.technicianId.vehicleInfo
        },
        status: 'assigned'
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start job tracking (technician)
router.post('/start-tracking/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.tracking.isTracking = true;
    request.tracking.jobStartTime = new Date();
    request.status = 'in-progress';
    await request.save();

    // Emit socket event to notify customer
    const io = req.app.get('io');
    if (io) {
      io.emit('job-started', {
        requestId: request._id,
        customerId: request.customerId,
        status: 'in-progress',
        startTime: request.tracking.jobStartTime
      });
    }

    res.json({ message: 'Job tracking started' });
  } catch (error) {
    console.error('Error starting job tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop job tracking (technician)
router.post('/stop-tracking/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.tracking.isTracking = false;
    if (request.tracking.jobStartTime) {
      const endTime = new Date();
      const startTime = new Date(request.tracking.jobStartTime);
      request.tracking.jobDurationMinutes = Math.round((endTime - startTime) / 60000);
    }
    await request.save();

    res.json({ message: 'Job tracking stopped' });
  } catch (error) {
    console.error('Error stopping job tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Alias for confirm-arrival (maps to confirm-technician-arrival)
router.post('/confirm-arrival/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.confirmations.technicianConfirmedArrival = true;
    await request.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(request.customerId.toString()).emit('technician-arrived-confirmation', {
      requestId: request._id,
      message: 'Technician has confirmed arrival'
    });

    res.json({ message: 'Arrival confirmed by technician' });
  } catch (error) {
    console.error('Error confirming arrival:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start job (moves from assigned to in-progress)
router.post('/start-job/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ message: 'Job must be assigned to start' });
    }

    request.status = 'in-progress';
    await request.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(request.customerId.toString()).emit('job-started', {
      requestId: request._id,
      message: 'Technician has started working on your job'
    });

    res.json({ message: 'Job started successfully', job: request });
  } catch (error) {
    console.error('Error starting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm technician arrival
router.post('/confirm-technician-arrival/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.confirmations.technicianConfirmedArrival = true;
    await request.save();

    res.json({ message: 'Arrival confirmed by technician' });
  } catch (error) {
    console.error('Error confirming technician arrival:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm technician completion
router.post('/confirm-technician-completion/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.confirmations.technicianConfirmedCompletion = true;
    
    // Stop tracking if still active
    if (request.tracking.isTracking) {
      request.tracking.isTracking = false;
      request.tracking.jobEndTime = new Date();
      
      if (request.tracking.jobStartTime) {
        const startTime = new Date(request.tracking.jobStartTime);
        const endTime = new Date(request.tracking.jobEndTime);
        request.tracking.jobDurationMinutes = Math.round((endTime - startTime) / 60000);
      }
    }
    
    // If both parties confirmed, mark as completed
    if (request.confirmations.customerConfirmedCompletion && 
        request.confirmations.technicianConfirmedCompletion) {
      request.status = 'completed';
    }
    
    await request.save();

    res.json({ message: 'Completion confirmed by technician' });
  } catch (error) {
    console.error('Error confirming technician completion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm customer arrival
router.post('/confirm-customer-arrival/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.confirmations.customerConfirmedArrival = true;
    await request.save();

    res.json({ message: 'Arrival confirmed by customer' });
  } catch (error) {
    console.error('Error confirming customer arrival:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm customer completion
router.post('/confirm-customer-completion/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.confirmations.customerConfirmedCompletion = true;
    
    // If both parties confirmed, mark as completed
    if (request.confirmations.technicianConfirmedCompletion && 
        request.confirmations.customerConfirmedCompletion) {
      request.status = 'completed';
      if (request.tracking.isTracking) {
        request.tracking.isTracking = false;
        request.tracking.jobEndTime = new Date();
        
        const startTime = new Date(request.tracking.jobStartTime);
        const endTime = new Date(request.tracking.jobEndTime);
        request.tracking.jobDurationMinutes = Math.round((endTime - startTime) / 60000);
      }
    }
    
    await request.save();

    res.json({ message: 'Completion confirmed by customer' });
  } catch (error) {
    console.error('Error confirming customer completion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for a job
router.get('/unread-messages/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Count unread messages from the other party
    const userType = request.technicianId?.toString() === req.user.userId ? 'technician' : 'customer';
    const otherPartyType = userType === 'technician' ? 'customer' : 'technician';
    
    const unreadCount = request.chat.filter(msg => 
      msg.senderType === otherPartyType && !msg.read
    ).length;

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Technician cancels a job
router.patch('/cancel/:id', authenticateToken, async (req, res) => {
    try {
        const job = await ServiceRequest.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.technicianId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this job' });
        }

        if (job.status === 'completed' || job.status === 'cancelled') {
            return res.status(400).json({ message: `Job is already ${job.status}` });
        }

        job.status = 'cancelled';
        job.technicianId = null;
        job.cancellation = {
            cancelledBy: 'technician',
            reason: req.body.reason || 'Technician cancelled the job.',
            timestamp: new Date(),
        };
        
        await job.save();

        // Notify customer
        const io = req.app.get('io');
        io.to(job.customerId.toString()).emit('job-cancelled', {
            requestId: job._id,
            message: 'The technician has cancelled the job.',
        });

        // Make job available again
        io.emit('service-request-available', job);

        res.json({ message: 'Job cancelled successfully', job });
    } catch (error) {
        console.error('Error cancelling job:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Customer cancels a job
router.post('/cancel/:id', authenticateToken, async (req, res) => {
    try {
        const job = await ServiceRequest.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.customerId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this job' });
        }

        if (job.status === 'completed' || job.status === 'cancelled') {
            return res.status(400).json({ message: `Job is already ${job.status}` });
        }

        job.status = 'cancelled';
        job.cancellation = {
            cancelledBy: 'customer',
            reason: req.body.reason || 'Customer cancelled the job.',
            timestamp: new Date(),
        };
        
        await job.save();

        // Notify technician if assigned
        const io = req.app.get('io');
        if (job.technicianId) {
            io.to(job.technicianId.toString()).emit('job-cancelled', {
                requestId: job._id,
                message: 'The customer has cancelled the job.',
            });
        }

        res.json({ message: 'Job cancelled successfully', job });
    } catch (error) {
        console.error('Error cancelling job:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get job details by ID
router.get('/job-details/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name phone email vehicleInfo')
      .populate('technicianId', 'name phone email vehicleInfo');
    
    if (!request) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send chat message
router.post('/send-message/:id', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is authorized (either customer or assigned technician)
    const isCustomer = request.customerId.toString() === req.user.userId;
    const isTechnician = request.technicianId && request.technicianId.toString() === req.user.userId;
    
    if (!isCustomer && !isTechnician) {
      return res.status(403).json({ message: 'Unauthorized to send messages for this job' });
    }

    const newMessage = {
      senderType: isCustomer ? 'customer' : 'technician',
      senderId: req.user.userId,
      message: message,
      timestamp: new Date(),
      isRead: false
    };

    request.chat.push(newMessage);
    await request.save();

    // Emit socket event to the other party
    const io = req.app.get('io');
    const recipientId = isCustomer ? request.technicianId : request.customerId;
    
    if (recipientId) {
      io.to(recipientId.toString()).emit('new-chat-message', {
        requestId: request._id,
        message: newMessage
      });
    }

    res.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit review
router.post('/review/:id', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, reviewType } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Verify user authorization
    if (reviewType === 'customer' && request.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (reviewType === 'technician' && request.technicianId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add review
    if (reviewType === 'customer') {
      request.reviews.customerReview = {
        rating: rating,
        comment: comment || ''
      };
    } else if (reviewType === 'technician') {
      request.reviews.technicianReview = {
        rating: rating,
        comment: comment || ''
      };
    }

    await request.save();

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
