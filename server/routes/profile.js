const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const Joi = require('joi');
const validate = require('../middleware/validate');

const equipmentSchema = {
  body: Joi.object({
    lockoutKit: Joi.boolean(),
    jumpStarter: Joi.boolean(),
    fuelCan: Joi.boolean()
  }).min(1)
};

// Get my profile
router.get('/me', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password -resetPasswordToken -resetPasswordExpiry');
  res.json(user);
});

// Update avatar (expects small base64 data URL or URL)
router.patch('/avatar', authenticateToken, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl || avatarUrl.length > 200000) { // ~200KB guard
    return res.status(400).json({ message: 'Invalid or too large avatar' });
  }
  await User.findByIdAndUpdate(req.user.userId, { avatarUrl });
  res.json({ message: 'Avatar updated' });
});

// Update equipment
router.patch('/equipment', authenticateToken, validate(equipmentSchema), async (req, res) => {
  const update = {};
  ['lockoutKit','jumpStarter','fuelCan'].forEach(k => {
    if (req.body[k] !== undefined) update[`equipment.${k}`] = req.body[k];
  });
  await User.findByIdAndUpdate(req.user.userId, update);
  res.json({ message: 'Equipment updated' });
});

// Online status toggle
router.patch('/online', authenticateToken, async (req, res) => {
  const { online } = req.body;
  if (typeof online !== 'boolean') return res.status(400).json({ message: 'online must be boolean'});
  await User.findByIdAndUpdate(req.user.userId, { isAvailable: online });
  res.json({ message: 'Online status updated' });
});

// Public: count online technicians
router.get('/technicians/online-count', async (_req, res) => {
  const count = await User.countDocuments({ userType: 'technician', isAvailable: true });
  res.json({ onlineTechnicians: count });
});

module.exports = router;
