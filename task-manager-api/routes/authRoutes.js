const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validate');

/**
 * POST /register (or /auth/register)
 * Description: Register a new user, hash password with bcrypt, save to MongoDB
 * Response: 201 Created or 400 Bad Request
 */
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists'
      });
    }

    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to MongoDB
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /login (or /auth/login)
 * Description: Authenticate user credentials, compare hash, and sign JWT token
 * Response: 200 OK or 400/401 Unauthorized
 */
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Sign JWT token valid for 1 hour
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
