const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware: Verifies JWT token in the Authorization header
 * Expected Header format: Authorization: Bearer <token>
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token missing.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded; // Sets user payload (e.g., id, email) on request object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token. Authentication failed.'
    });
  }
};

module.exports = auth;
