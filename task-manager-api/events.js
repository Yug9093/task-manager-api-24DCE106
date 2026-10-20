const EventEmitter = require('events');

// Step 1: Create dedicated EventEmitter subclass for task domain events
class TaskEvents extends EventEmitter {}

// Export singleton instance
module.exports = new TaskEvents();
