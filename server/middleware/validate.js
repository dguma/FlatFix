const Joi = require('joi');

// Generic validation middleware
module.exports = (schema) => (req, res, next) => {
  const errors = [];
  // Validate body
  if (schema.body) {
    const { error, value } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) errors.push(...error.details.map(d => d.message)); else req.body = value;
  }
  // Validate params
  if (schema.params) {
    const { error, value } = schema.params.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) errors.push(...error.details.map(d => d.message)); else req.params = value;
  }
  // Validate query
  if (schema.query) {
    const { error, value } = schema.query.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) errors.push(...error.details.map(d => d.message)); else req.query = value;
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};
