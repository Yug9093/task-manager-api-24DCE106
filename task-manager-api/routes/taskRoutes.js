const express = require('express');
const router = express.Router();

// In-memory Task Database
let tasks = [
  {
    id: 1,
    title: 'Setup Express Project',
    description: 'Initialize Node project and install Express middleware',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Build CRUD Endpoints',
    description: 'Implement GET, POST, PUT, DELETE routes for tasks',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

let nextId = 3;

/**
 * GET /tasks
 * Description: Retrieve all tasks
 * Response: 200 OK
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

/**
 * GET /tasks/:id
 * Description: Retrieve a single task by ID
 * Response: 200 OK or 404 Not Found
 */
router.get('/:id', (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * POST /tasks
 * Description: Create a new task
 * Response: 201 Created or 400 Bad Request
 */
router.post('/', (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    // Validation: Title is required
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and must be a non-empty string'
      });
    }

    const newTask = {
      id: nextId++,
      title: title.trim(),
      description: description ? String(description).trim() : '',
      completed: typeof completed === 'boolean' ? completed : false,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /tasks/:id
 * Description: Update an existing task by ID
 * Response: 200 OK, 400 Bad Request, or 404 Not Found
 */
router.put('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`
      });
    }

    const { title, description, completed } = req.body;

    // Validation: If title is provided, ensure it is non-empty
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Title must be a non-empty string if provided'
      });
    }

    // Validation: If completed is provided, ensure it is boolean
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Completed must be a boolean value if provided'
      });
    }

    const existingTask = tasks[taskIndex];
    const updatedTask = {
      ...existingTask,
      title: title !== undefined ? title.trim() : existingTask.title,
      description: description !== undefined ? String(description).trim() : existingTask.description,
      completed: completed !== undefined ? completed : existingTask.completed,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /tasks/:id
 * Description: Delete a task by ID
 * Response: 200 OK or 404 Not Found
 */
router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`
      });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
