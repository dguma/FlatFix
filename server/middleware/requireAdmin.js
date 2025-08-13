module.exports = function requireAdmin(req, res, next) {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
