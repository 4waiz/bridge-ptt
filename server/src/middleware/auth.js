const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRoles,
};
