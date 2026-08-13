const express = require('express');
const loggerMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Built-in Body Parsing Middleware
app.use(express.json());

// 2. Custom Application-level Logging Middleware
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
