require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const loggerMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load Event Listeners for background asynchronous notification handling (Practical 10)
require('./listeners');

const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskDB')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 1. Enable CORS for cross-origin requests
app.use(cors());

// 2. Built-in Body Parsing Middleware
app.use(express.json());

// 3. Custom Application-level Logging Middleware
app.use(loggerMiddleware);

// 4. Root Endpoint & API Documentation
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Task Management RESTful API with JWT Authentication',
    endpoints: {
      register: 'POST /register or POST /auth/register',
      login: 'POST /login or POST /auth/login',
      getAllTasks: 'GET /tasks (Requires Bearer Token)',
      getTaskById: 'GET /tasks/:id (Requires Bearer Token)',
      createTask: 'POST /tasks (Requires Bearer Token)',
      updateTask: 'PUT /tasks/:id (Requires Bearer Token)',
      deleteTask: 'DELETE /tasks/:id (Requires Bearer Token)',
      aiGenerateDescription: 'POST /api/ai/generate-description',
      testError: 'GET /test-error'
    }
  });
});

// 5. Authentication Routes
app.use('/auth', authRoutes);
app.use('/', authRoutes);

// 6. Protected Task Routes
app.use('/tasks', taskRoutes);

// 7. AI Assistant Routes (Practical 13)
app.use('/api/ai', aiRoutes);

// Endpoint to simulate unhandled internal server error for global error handler testing
app.get('/test-error', (req, res, next) => {
  const error = new Error('Simulated internal server failure for testing error handler');
  error.statusCode = 500;
  next(error);
});

// 7. 404 Handler for Undefined Routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// 8. Global Error Handling Middleware (MUST BE LAST)
app.use(errorHandler);

// Start Server (only when not in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Task Manager API Server Running`);
    console.log(`URL: http://localhost:${PORT}`);
  });
}

module.exports = app;
