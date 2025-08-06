const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// Create a new service request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { serviceType, location, description } = req.body;

    const serviceRequest = new ServiceRequest({
      customerId: req.user.userId,
      serviceType,
      location,
      description,
      status: 'pending'
    });

    await serviceRequest.save();

    res.status(201).json({
      message: 'Service request created successfully',
      request: serviceRequest
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Failed to create service request' });
  }
});

// Get available service requests for technicians
router.get('/available', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const availableRequests = await ServiceRequest.find({ 
      status: 'pending'
    }).populate('customerId', 'username email');

    res.json(availableRequests);
  } catch (error) {
    console.error('Error fetching available requests:', error);
    res.status(500).json({ message: 'Failed to fetch available requests' });
  }
});

// Claim a service request
router.post('/claim/:requestId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    request.technicianId = req.user.userId;
    request.status = 'assigned';
    await request.save();

    res.json({ message: 'Request claimed successfully', request });
  } catch (error) {
    console.error('Error claiming request:', error);
    res.status(500).json({ message: 'Failed to claim request' });
  }
});

// Get customer's service requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    const requests = await ServiceRequest.find({ customerId: req.user.userId })
      .populate('technicianId', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching customer requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Get technician's jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const jobs = await ServiceRequest.find({ technicianId: req.user.userId })
      .populate('customerId', 'username email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching technician jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Update service status
router.patch('/status/:requestId', authenticateToken, async (req, res) => {
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

    const allowedStatuses = ['in-progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    await request.save();

    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
