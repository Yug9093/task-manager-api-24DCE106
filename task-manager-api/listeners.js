const taskEvents = require('./events');

/**
 * Register listener for 'task-created' event
 * Features:
 * - Logs task title, assigned user, and precise ISO timestamps
 * - Uses an artificial delay (setTimeout) to clearly demonstrate asynchronous, non-blocking behavior
 */
taskEvents.on('task-created', (task) => {
  const triggerTime = new Date().toISOString();
  const assignedUser = (task.user && task.user.email) 
    ? task.user.email 
    : (task.user ? task.user.toString() : 'Unassigned');

  console.log(`[Notification Listener] Event 'task-created' received at ${triggerTime}`);
  console.log(`[Notification Listener] Starting async dispatch for Task: "${task.title}" (User: ${assignedUser})`);

  // Step 5: Artificial delay (1500ms) simulating external email/webhook notification
  setTimeout(() => {
    const completionTime = new Date().toISOString();
    console.log(`[Notification] Task "${task.title}" created at ${completionTime} (User: ${assignedUser})`);
  }, 1500);
});

module.exports = taskEvents;
