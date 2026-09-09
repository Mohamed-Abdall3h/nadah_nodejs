const { requireAuth } = require('./auth');

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'صلاحيات المشرف مطلوبة' });
    }
    next();
  });
}

module.exports = { requireAdmin };
