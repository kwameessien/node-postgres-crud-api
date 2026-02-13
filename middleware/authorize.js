/**
 * Authorization middleware - must be used after requireAuth (req.user must exist)
 */

// Require specific role(s)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userRole = req.user.role || 'user';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
  }
  next();
};

// Require admin role
const requireAdmin = requireRole('admin');

// Require resource owner (user accessing their own record) or admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const resourceId = parseInt(req.params.id, 10);
  if (isNaN(resourceId)) return next(new Error('Invalid user ID'));
  if ((req.user.role || 'user') === 'admin') return next();
  if (req.user.id === resourceId) return next();
  return res.status(403).json({ error: 'Forbidden', message: 'You can only access your own resources' });
};

module.exports = { requireRole, requireAdmin, requireOwnerOrAdmin };
