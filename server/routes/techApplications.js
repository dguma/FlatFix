const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const TechApplication = require('../models/TechApplication');
const User = require('../models/User');
const Joi = require('joi');
const validate = require('../middleware/validate');

const applicationSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(6).max(40).required(),
    experienceYears: Joi.number().min(0).max(50).optional(),
    vehicle: Joi.object({
      make: Joi.string().allow('', null),
      model: Joi.string().allow('', null),
      year: Joi.string().allow('', null),
      licensePlate: Joi.string().allow('', null)
    }).optional(),
    equipmentOwned: Joi.object({
      lockoutKit: Joi.boolean(),
      jumpStarter: Joi.boolean(),
      fuelCan: Joi.boolean(),
      torqueWrench: Joi.boolean(),
      impactGun: Joi.boolean()
    }).optional()
  })
};

router.post('/apply', validate(applicationSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await TechApplication.findOne({ email, status: { $in: ['pending','waitlisted'] } });
    if (existing) return res.status(409).json({ message: 'An application is already in review for this email.' });

    // Gate: user must exist and have 100% pass on spare-tire skill test
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Create an account and complete the Spare Tire guide and knowledge check before applying.' });
    }
    const passedSpare = (user.skillTests || []).some(t => t.key === 'spare-tire' && t.passedAt);
    if (!passedSpare) {
      return res.status(400).json({ message: 'Requirement not met: You must score 100% on the Spare Tire knowledge check to apply.' });
    }

    const app = new TechApplication(req.body);
    await app.save();
    res.status(201).json({ message: 'Application received. We will review shortly.', applicationId: app._id });
  } catch (e) {
    console.error('apply error', e);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

router.get('/applications', authenticateToken, requireAdmin, async (req, res) => {
  const list = await TechApplication.find().sort({ createdAt: -1 }).limit(200);
  res.json(list);
});

router.patch('/applications/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['pending','waitlisted','approved','rejected','needs-info'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const app = await TechApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found' });
  app.status = status;
  const now = new Date();
  if (status === 'waitlisted') app.waitlistedAt = now;
  if (status === 'approved') app.approvedAt = now;
  if (status === 'rejected') app.rejectedAt = now;
  app.reviewedAt = now;
  await app.save();
  const user = await User.findOne({ email: app.email });
  if (user && status === 'approved') {
    user.applicationStatus = 'approved';
    user.onboardingComplete = true;
    user.applicationId = app._id;
    await user.save();
  }
  res.json({ message: 'Status updated', application: app });
});

module.exports = router;
