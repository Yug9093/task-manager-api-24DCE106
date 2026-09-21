const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

/**
 * GET /tasks
 * Description: Retrieve all tasks from MongoDB
 * Response: 200 OK
 */
router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find();
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
 * Description: Retrieve a single task by MongoDB ObjectId
 * Response: 200 OK or 404 Not Found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

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
 * Description: Create a new task in MongoDB
 * Response: 201 Created or 400 Bad Request
 */
router.post('/', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const newTask = await Task.create({
      title,
      description,
      completed
    });

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
 * Description: Update an existing task by MongoDB ObjectId
 * Response: 200 OK, 400 Bad Request, or 404 Not Found
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, completed },
      { new: true, runValidators: true }
    );

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
 * Description: Delete a task by MongoDB ObjectId
 * Response: 200 OK or 404 Not Found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

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
