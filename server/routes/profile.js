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

// Schema for recording a skill test and optionally awarding a badge
const skillTestSchema = {
  body: Joi.object({
    key: Joi.string().valid('spare-tire').required(),
    name: Joi.string().default('Spare Tire Change Verified'),
    score: Joi.number().min(0).max(100).required()
  })
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

// Get my badges
router.get('/badges', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId).select('badges');
  res.json({ badges: user?.badges || [] });
});

// Submit a skill test result; if ==100, record pass and award/ensure badge
router.post('/skill-tests', authenticateToken, validate(skillTestSchema), async (req, res) => {
  const { key, name, score } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Upsert skill test entry
  const existing = (user.skillTests || []).find(t => t.key === key);
  if (existing) {
    existing.score = score;
    existing.passedAt = score >= 100 ? new Date() : undefined;
  } else {
    user.skillTests = user.skillTests || [];
    user.skillTests.push({ key, score, passedAt: score >= 100 ? new Date() : undefined });
  }

  // If pass, ensure badge exists
  if (score >= 100) {
    const hasBadge = (user.badges || []).some(b => b.key === key);
    if (!hasBadge) {
      user.badges = user.badges || [];
      user.badges.push({ key, name: name || 'Skill Verified', issuedAt: new Date() });
    }
  }

  await user.save();
  res.json({ message: 'Skill test recorded', passed: score >= 100, badges: user.badges });
});

module.exports = router;
