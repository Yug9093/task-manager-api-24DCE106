/**
 * Global Error Handling Middleware
 * Must be defined with 4 parameters (err, req, res, next) and registered LAST in Express pipeline.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err);

  // Mongoose Validation Error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        message: 'Validation Error',
        details: errors
      }
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        message: `Invalid ID format: ${err.value}`
      }
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Default clean JSON response
  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message: message
    }
  });
};

module.exports = errorHandler;
