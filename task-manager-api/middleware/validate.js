/**
 * Validation Middleware: Checks required fields before controllers execute
 */

// Email regex pattern
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validate User Registration payload
 */
const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address'
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  next();
};

/**
 * Validate User Login payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  next();
};

/**
 * Validate Task Creation / Update payload
 */
const validateTask = (req, res, next) => {
  const { title } = req.body;

  // Title is strictly required when creating a new task (POST)
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and cannot be empty'
      });
    }
  }

  // If title is explicitly provided on PUT, it cannot be empty string
  if (req.method === 'PUT' && title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title cannot be empty'
      });
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask
};
