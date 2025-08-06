const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// Create a new service request
router.post('/request', authenticateToken, async (req, res) => {
  /*
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
      default:
        return res.status(400).json({ message: 'Invalid service type' });
    }

    const totalAmount = 20 + serviceFee; // Base fee + service fee

    const serviceRequest = new ServiceRequest({
      customerId: req.user.userId,
      serviceType,
      location,
      description,
      images: images || [],
      totalAmount,
      status: 'pending',
      createdAt: new Date()
    });

    await serviceRequest.save();

    // Emit socket event to notify available technicians
    const io = req.app.get('io');
    io.to('technicians').emit('new-service-request', {
      requestId: serviceRequest._id,
      serviceType,
      location,
      description,
      totalAmount
    });

    res.status(201).json({
      message: 'Service request created successfully',
      request: serviceRequest
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Failed to create service request' });
  }
  */
});

// Get available service requests for technicians
router.get('/available', authenticateToken, async (req, res) => {
  
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const availableRequests = await ServiceRequest.find({ 
      status: 'pending',
      technicianId: null 
    }).populate('customerId', 'name email location');

    res.json(availableRequests);
  } catch (error) {
    console.error('Error fetching available requests:', error);
    res.status(500).json({ message: 'Failed to fetch available requests' });
  }
  
});

// Claim a service request
router.post('/claim/:requestId', authenticateToken, async (req, res) => {
  
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.status !== 'pending' || request.technicianId) {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    request.technicianId = req.user.userId;
    request.status = 'assigned';
    request.assignedAt = new Date();
    await request.save();

    // Emit socket event to customer
    const io = req.app.get('io');
    io.to(`customer-${request.customerId}`).emit('technician-assigned', {
      requestId: request._id,
      technicianId: req.user.userId
    });

    res.json({ message: 'Request claimed successfully', request });
  } catch (error) {
    console.error('Error claiming request:', error);
    res.status(500).json({ message: 'Failed to claim request' });
  }
  
});

// Get customer's service requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  /*
  try {
    if (req.user.userType !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    const requests = await ServiceRequest.find({ customerId: req.user.userId })
      .populate('technicianId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching customer requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
  */
});

// Get technician's jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  /*
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const jobs = await ServiceRequest.find({ technicianId: req.user.userId })
      .populate('customerId', 'name email location')
      .sort({ assignedAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching technician jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
  */
});

// Update service status
router.patch('/status/:requestId', authenticateToken, async (req, res) => {
  /*
  try {
    const { status } = req.body;
    const request = await ServiceRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    const isCustomer = request.customerId.toString() === req.user.userId;
    const isTechnician = request.technicianId && request.technicianId.toString() === req.user.userId;
    
    if (!isCustomer && !isTechnician) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const allowedStatuses = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    if (status === 'completed') {
      request.completedAt = new Date();
    }
    await request.save();

    // Emit socket event
    const io = req.app.get('io');
    const recipientId = isCustomer ? request.technicianId : request.customerId;
    if (recipientId) {
      io.to(recipientId.toString()).emit('status-update', {
        requestId: request._id,
        status
      });
    }

    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
  */
});

// Send chat message
router.post('/send-message/:id', authenticateToken, async (req, res) => {
  /*
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
  */
});

// Cancel service request
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  /*
  try {
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is authorized to cancel
    const isCustomer = request.customerId.toString() === req.user.userId;
    const isTechnician = request.technicianId && request.technicianId.toString() === req.user.userId;
    
    if (!isCustomer && !isTechnician) {
      return res.status(403).json({ message: 'Unauthorized to cancel this request' });
    }

    // Don't allow cancellation if already completed
    if (request.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed request' });
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    await request.save();

    // Emit socket event to the other party
    const io = req.app.get('io');
    const recipientId = isCustomer ? request.technicianId : request.customerId;
    
    if (recipientId) {
      io.to(recipientId.toString()).emit('request-cancelled', {
        requestId: request._id,
        cancelledBy: req.user.userType
      });
    }

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ message: 'Server error' });
  }
  */
});

module.exports = router;
