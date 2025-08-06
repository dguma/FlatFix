const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// All routes are temporarily commented out to debug a startup crash.

/*
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// Create a new service request
router.post('/request', authenticateToken, async (req, res) => {
  // ... implementation
});

// Get available service requests for technicians
router.get('/available', authenticateToken, async (req, res) => {
  // ... implementation
});

// Claim a service request
router.post('/claim/:requestId', authenticateToken, async (req, res) => {
  // ... implementation
});

// Get customer's service requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  // ... implementation
});

// Get technician's jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  // ... implementation
});

// Update service status
router.patch('/status/:requestId', authenticateToken, async (req, res) => {
  // ... implementation
});

// Send chat message
router.post('/send-message/:id', authenticateToken, async (req, res) => {
  // ... implementation
});

// Cancel service request
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  // ... implementation
});
*/

module.exports = router;
