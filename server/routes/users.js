const express = require('express');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// Update user location
router.patch('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    await User.findByIdAndUpdate(req.user.userId, {
      location: { latitude, longitude, address }
    });

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
});

// Update technician availability
router.patch('/availability', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const { isAvailable } = req.body;

    await User.findByIdAndUpdate(req.user.userId, { isAvailable });

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update availability', error: error.message });
  }
});

// Get nearby technicians (for admin or analytics)
router.get('/technicians/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Find available technicians within radius
    const technicians = await User.find({
      userType: 'technician',
      isAvailable: true,
      'location.latitude': {
        $gte: parseFloat(latitude) - radius / 111, // Rough conversion to degrees
        $lte: parseFloat(latitude) + radius / 111
      },
      'location.longitude': {
        $gte: parseFloat(longitude) - radius / 111,
        $lte: parseFloat(longitude) + radius / 111
      }
    }).select('name rating completedJobs location vehicleInfo');

    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get nearby technicians', error: error.message });
  }
});

// Admin route to delete a user and cancel their jobs
router.delete('/:userId', authenticateToken, async (req, res) => {
    // First, check if the authenticated user is an admin
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete users.' });
    }

    try {
        const userIdToDelete = req.params.userId;

        // Find the user to be deleted
        const userToDelete = await User.findById(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Cancel all jobs associated with this user
        await ServiceRequest.updateMany(
            { customerId: userIdToDelete },
            { 
                status: 'cancelled',
                cancellation: {
                    cancelledBy: 'system',
                    reason: 'User account deleted.',
                    timestamp: new Date(),
                },
                technicianId: null,
            }
        );

        // Delete the user
        await User.findByIdAndDelete(userIdToDelete);

        res.json({ message: `User ${userToDelete.name} and all their associated jobs have been deleted and cancelled.` });

    } catch (error) {
        console.error('Error deleting user and their jobs:', error);
        res.status(500).json({ message: 'Server error during user deletion.' });
    }
});

module.exports = router;
