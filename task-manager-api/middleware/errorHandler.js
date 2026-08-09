/**
 * Global Error Handling Middleware
 * Must be defined with 4 parameters (err, req, res, next) and registered LAST in Express pipeline.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error stack on server console for developer debugging
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Return clean, sanitized JSON response to client (without exposing raw stack traces)
  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message: message
    }
  });
};

module.exports = errorHandler;
