require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const loggerMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');

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

// 3. Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Task Management RESTful API',
    endpoints: {
      getAllTasks: 'GET /tasks',
      getTaskById: 'GET /tasks/:id',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id',
      testError: 'GET /test-error'
    }
  });
});

// 4. Express Router for /tasks
app.use('/tasks', taskRoutes);

// Endpoint to simulate unhandled internal server error for global error handler testing
app.get('/test-error', (req, res, next) => {
  const error = new Error('Simulated internal server failure for testing error handler');
  error.statusCode = 500;
  next(error);
});

// 5. 404 Handler for Undefined Routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// 6. Global Error Handling Middleware (MUST BE LAST)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Task Manager API Server Running`);
  console.log(`URL: http://localhost:${PORT}`);
});

module.exports = app;
