const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');

// Protect all /tasks routes with JWT authentication middleware
router.use(auth);

/**
 * GET /tasks
 * Description: Retrieve tasks from MongoDB for the authenticated user only
 * Response: 200 OK
 */
router.get('/', async (req, res, next) => {
  try {
    // Return only tasks owned by the authenticated user
    const tasks = await Task.find({ user: req.user.id })
      .populate('user', 'email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tasks/:id
 * Description: Retrieve a single task by MongoDB ObjectId for the authenticated user
 * Response: 200 OK or 404 Not Found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'email');

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
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tasks
 * Description: Create a new task in MongoDB strictly linked to the authenticated user
 * Response: 201 Created or 400 Bad Request
 */
router.post('/', validateTask, async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: Boolean(completed),
      user: req.user.id
    });

    const populatedTask = await Task.findById(newTask._id).populate('user', 'email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask || newTask
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /tasks/:id
 * Description: Update an existing task owned by the authenticated user
 * Response: 200 OK, 400 Bad Request, or 404 Not Found
 */
router.put('/:id', validateTask, async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (completed !== undefined) updateData.completed = Boolean(completed);

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'email');

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`
      });
    }

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
 * Description: Delete a task owned by the authenticated user
 * Response: 200 OK or 404 Not Found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`
      });
    }

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
