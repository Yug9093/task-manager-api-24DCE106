const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');
const cache = require('../cache');
const taskEvents = require('../events');

// Protect all /tasks routes with JWT authentication middleware
router.use(auth);

/**
 * GET /tasks
 * Description: Retrieve tasks from cache if present; otherwise query MongoDB and cache results
 * Response: 200 OK (with X-Cache: HIT or MISS header)
 */
router.get('/', async (req, res, next) => {
  try {
    // Isolate cache key strictly per authenticated user so users never share task data
    const cacheKey = `tasks_${req.user.id}`;

    // 1. Step 3: Check user-specific cache first
    // Note: To temporarily disable caching for manual lab comparison, comment out this block:
    if (req.query.noCache !== 'true') {
      const cached = cache.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    }

    // 2. Cache MISS: Query MongoDB strictly for the authenticated user
    const tasks = await Task.find({ user: req.user.id })
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .lean();

    const responsePayload = {
      success: true,
      count: tasks.length,
      data: tasks
    };

    // 3. Store only in this user's cache with 60-second TTL
    cache.set(cacheKey, responsePayload);

    res.set('X-Cache', 'MISS');
    res.status(200).json(responsePayload);
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
 * Cache Behavior: Invalidates cached task list to prevent serving stale data
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

    // Invalidate user's cache on write operation (POST)
    cache.del(`tasks_${req.user.id}`);
    cache.del(`all_tasks_${req.user.id}`);
    cache.del('all_tasks');

    const createdTask = populatedTask || newTask;

    // Step 3: Log API response timestamp and respond immediately
    const responseTime = new Date().toISOString();
    console.log(`[API] Response sent at ${responseTime}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });

    // Step 3: Emit 'task-created' event asynchronously without blocking response
    taskEvents.emit('task-created', createdTask);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /tasks/:id
 * Description: Update an existing task owned by the authenticated user
 * Cache Behavior: Invalidates cached task list to ensure latest data is returned
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
      { returnDocument: 'after', runValidators: true }
    ).populate('user', 'email');

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`
      });
    }

    // Invalidate user's cache on write operation (PUT)
    cache.del(`tasks_${req.user.id}`);
    cache.del(`all_tasks_${req.user.id}`);
    cache.del('all_tasks');

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
 * Cache Behavior: Invalidates cached task list to ensure deleted item is not served
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

    // Invalidate user's cache on write operation (DELETE)
    cache.del(`tasks_${req.user.id}`);
    cache.del(`all_tasks_${req.user.id}`);
    cache.del('all_tasks');

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
