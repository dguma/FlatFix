const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const validate = require('../middleware/validate');
const Joi = require('joi');

const allowedServiceTypes = ['air-inflation','spare-replacement','shop-pickup','lockout','jumpstart','fuel-delivery'];
const createRequestSchema = {
  body: Joi.object({
    serviceType: Joi.string().valid(...allowedServiceTypes).required(),
    location: Joi.object({
      address: Joi.string().min(3).required(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional()
    }).required(),
    description: Joi.string().min(5).max(500).required(),
    // Optional for shop-pickup flow
    selectedShop: Joi.object({
      name: Joi.string().max(120).optional(),
      phone: Joi.string().max(40).optional(),
      address: Joi.string().max(200).optional(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional()
    }).optional(),
  estimatedMiles: Joi.number().min(0).max(200).optional(),
  // Optional for jumpstart: number of extra jumps beyond the first (0-2)
  jumpExtras: Joi.number().integer().min(0).max(2).optional()
  })
};

const statusUpdateSchema = {
  params: Joi.object({
    requestId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
  status: Joi.string().valid('assigned','en-route','on-location','in-progress','completed','cancelled').required(),
  reason: Joi.string().max(300).optional()
  })
};

// Create a new service request
router.post('/request', authenticateToken, validate(createRequestSchema), async (req, res) => {
  try {
  const { serviceType, location, description, selectedShop, estimatedMiles, jumpExtras } = req.body;

    // Simple pricing matrix (could later move to config collection)
    const pricingMatrix = {
      'air-inflation': { base: 20, service: 0 },
      'spare-replacement': { base: 20, service: 15 },
      // Shop coordination: customer pays shop directly; tech paid for labor + distance
      'shop-pickup': { base: 20, service: 30, perMile: 1.5 },
      // Lockout: $20 base + labor
      'lockout': { base: 20, service: 25 },
      // Jumpstart: $20 base covers first jump; up to 2 extra jumps at $12.50 each (cap $45 total)
      'jumpstart': { base: 20, service: 0, perUnit: 12.5, maxUnits: 2 },
      // Fuel delivery: $20 base + $10/gal up to 2 gallons; no extra service fee
      'fuel-delivery': { base: 20, service: 0, perUnit: 10, maxUnits: 2 }
    };

    const baseDoc = {
      customerId: req.user.userId,
      serviceType,
      location,
      description,
      status: 'pending',
      pricing: pricingMatrix[serviceType]
    };

    // For shop-pickup, embed selected shop and estimate if provided
    if (serviceType === 'shop-pickup') {
      if (selectedShop) baseDoc.selectedShop = selectedShop;
      if (typeof estimatedMiles === 'number') {
        baseDoc.pricing.estimatedMiles = estimatedMiles;
        const { base = 0, service = 0, perMile = 0 } = baseDoc.pricing;
        baseDoc.pricing.estimate = Math.round((base + service + perMile * estimatedMiles) * 100) / 100;
      } else {
        // Try to compute based on coordinates if provided
        const aLat = baseDoc.location?.latitude;
        const aLon = baseDoc.location?.longitude;
        const bLat = selectedShop?.latitude;
        const bLon = selectedShop?.longitude;
        if (typeof aLat === 'number' && typeof aLon === 'number' && typeof bLat === 'number' && typeof bLon === 'number') {
          const toRad = (v) => (v * Math.PI) / 180;
          const R = 3958.8; // miles
          const dLat = toRad(bLat - aLat);
          const dLon = toRad(bLon - aLon);
          const lat1 = toRad(aLat);
          const lat2 = toRad(bLat);
          const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const oneWay = R * c;
          const roundTrip = oneWay * 2;
          baseDoc.pricing.estimatedMiles = Math.round(roundTrip * 10) / 10;
          const { base = 0, service = 0, perMile = 0 } = baseDoc.pricing;
          baseDoc.pricing.estimate = Math.round((base + service + perMile * baseDoc.pricing.estimatedMiles) * 100) / 100;
          if (!baseDoc.selectedShop) baseDoc.selectedShop = {};
          baseDoc.selectedShop.distanceMiles = Math.round(oneWay * 10) / 10;
        }
      }
    }

    // For jumpstart, compute estimate if extras provided (cap $45)
    if (serviceType === 'jumpstart') {
      const extras = typeof jumpExtras === 'number' ? Math.max(0, Math.min(2, jumpExtras)) : 0;
      if (extras > 0) {
        baseDoc.pricing.estimatedUnits = extras;
        const preliminary = baseDoc.pricing.base + extras * (baseDoc.pricing.perUnit || 0);
        baseDoc.pricing.estimate = Math.min(45, Math.round(preliminary * 100) / 100);
      } else {
        baseDoc.pricing.estimate = baseDoc.pricing.base;
      }
    }

    const serviceRequest = new ServiceRequest(baseDoc);

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
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }
    // Filter by technician equipment so they only see jobs they can perform
    const tech = await User.findById(req.user.userId).lean();
    if (!tech) return res.status(401).json({ message: 'Technician not found' });

    const equipmentFilters = [];
    if (!tech.equipment?.lockoutKit) equipmentFilters.push('lockout');
    if (!tech.equipment?.jumpStarter) equipmentFilters.push('jumpstart');
    if (!tech.equipment?.fuelCan) equipmentFilters.push('fuel-delivery');

    const query = { status: 'pending' };
    if (equipmentFilters.length) {
      query.serviceType = { $nin: equipmentFilters };
    }

    const availableRequests = await ServiceRequest.find(query)
      .populate('customerId', 'name email');

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
    if (req.user.userType !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    const requests = await ServiceRequest.find({ customerId: req.user.userId })
      .populate('technicianId', 'name email badges')
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
    if (req.user.userType !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const jobs = await ServiceRequest.find({ technicianId: req.user.userId })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching technician jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Update service status
router.patch('/status/:requestId', authenticateToken, validate(statusUpdateSchema), async (req, res) => {
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

  const allowedStatuses = ['assigned','en-route','on-location','in-progress','completed','cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    if (status === 'cancelled') {
      request.cancellation = {
        cancelledBy: req.user.userType === 'technician' ? 'technician' : (req.user.userType === 'customer' ? 'customer' : 'system'),
        reason: req.body.reason || 'No reason provided',
        timestamp: new Date()
      };
    }
    await request.save();

    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Get single service request (authorized: owner or assigned tech)
router.get('/:requestId', authenticateToken, validate({ params: Joi.object({ requestId: Joi.string().hex().length(24).required() }) }), async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId)
      .populate('customerId', 'name email')
      .populate('technicianId', 'name email badges');
    if (!request) return res.status(404).json({ message: 'Not found' });
    const isCustomer = request.customerId && request.customerId._id.toString() === req.user.userId;
    const isTechnician = request.technicianId && request.technicianId._id.toString() === req.user.userId;
    if (!isCustomer && !isTechnician && req.user.userType !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.json(request);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch request' });
  }
});

module.exports = router;
// -- EOF of core job routes --

// Shop suggestions via OpenStreetMap Nominatim + Overpass (no API key; respectful limits)
router.get('/shops/suggestions', async (req, res) => {
  try {
    const postal = req.query.postal ? String(req.query.postal) : null;
    const latParam = req.query.lat ? Number(req.query.lat) : null;
    const lonParam = req.query.lon ? Number(req.query.lon) : null;
    const radiusMiles = Number(req.query.radius || 50);
    const radiusMeters = Math.min(Math.max(radiusMiles, 1), 50) * 1609.34; // cap 50mi

    // 1) Center
    let center;
    if (typeof latParam === 'number' && typeof lonParam === 'number' && !isNaN(latParam) && !isNaN(lonParam)) {
      center = { lat: latParam, lon: lonParam };
    } else if (postal) {
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postal)}`, {
  headers: { 'User-Agent': 'ZipFix.ai/1.0 (Contact: support@zipfix.ai)' }
      });
      const geo = await geoResp.json();
      if (!Array.isArray(geo) || !geo.length) return res.json({ postal, radius: radiusMiles, suggestions: [] });
      center = { lat: parseFloat(geo[0].lat), lon: parseFloat(geo[0].lon) };
    } else {
      return res.json({ postal: null, radius: radiusMiles, suggestions: [] });
    }

    // 2) Overpass query for tire shops/flat fix within radius
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["shop"="tyres"](around:${radiusMeters},${center.lat},${center.lon});
        node["amenity"="car_repair"](around:${radiusMeters},${center.lat},${center.lon});
      );
      out body;
    `;
    const overResp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ZipFix.ai/1.0 (Contact: support@zipfix.ai)' },
      body: new URLSearchParams({ data: overpassQuery }).toString()
    });
    const over = await overResp.json();
    const elements = Array.isArray(over.elements) ? over.elements : [];

    // Map to suggestions with best-effort phone/address from tags
    const suggestions = elements.slice(0, 25).map(el => {
      const t = el.tags || {};
      const name = t.name || 'Tire/Auto Repair Shop';
      const phone = t.phone || t['contact:phone'] || t['contact:mobile'] || 'N/A';
      const addressParts = [t['addr:housenumber'], t['addr:street'], t['addr:city'], t['addr:state'], t['addr:postcode']].filter(Boolean);
      const address = addressParts.join(', ');
      return { name, phone, address, latitude: el.lat, longitude: el.lon };
    });

    res.json({ postal, radius: radiusMiles, center, suggestions });
  } catch (e) {
    console.error('shops/suggestions error', e);
    res.status(500).json({ suggestions: [] });
  }
});
