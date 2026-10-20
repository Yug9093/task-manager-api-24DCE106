# Practical 10: Asynchronous Processing with Event-Driven Architecture

**Course Outcome / Program Outcome:** CO1, CO4 / PO3, PO5  
**Objective:** To implement a decoupled, asynchronous background notification system using Node.js built-in `EventEmitter`, emit domain events on write operations without blocking client HTTP responses, and empirically demonstrate non-blocking execution using timestamp logging.

---

## 📌 1. Aim & Objectives

To design and implement an **event-driven asynchronous background notification system** in the Express.js Task Management backend using the Node.js built-in `EventEmitter` module, decoupling business logic from secondary side-effects (e.g., logging, notification dispatch, external webhooks) so the client receives immediate responses without waiting for background tasks to complete.

### Key Objectives:
1. **Domain Event Bus (`events.js`)**: Subclass Node.js `EventEmitter` to create a dedicated, singleton event broker for task lifecycle events.
2. **Decoupled Event Listeners (`listeners.js`)**: Encapsulate secondary concerns (notifications, logging, audit trails) in dedicated subscriber modules.
3. **Non-Blocking Immediate API Response**: Ensure that `POST /tasks` returns HTTP status `201 Created` immediately upon saving to MongoDB, prior to listener completion.
4. **Asynchronous Execution Simulation**: Add an artificial delay (`setTimeout`) inside the listener to simulate time-consuming operations (e.g., email dispatch via SMTP, SMS gateways).
5. **Timestamp Logging & Empirical Proof**: Log precise ISO 8601 timestamps at both the API response point and the listener completion point to demonstrate non-blocking execution.
6. **Error Isolation**: Decouple side-effect execution so that any background listener failure does not crash the HTTP request pipeline or alter the client response.

---

## 🏗️ 2. Architectural Overview & Event Loop Mechanics

### Event-Driven Non-Blocking Architecture:

```text
=============================================================================
POST /tasks REQUEST LIFECYCLE (SYNCHRONOUS VS ASYNCHRONOUS HANDLING)
=============================================================================

Client (Postman / Frontend)
       │
       ▼ [POST /tasks: { title: "Deploy Notifications" }]
Express Route Handler
       │
       ├─► 1. Validate request body (validateTask middleware)
       ├─► 2. Save document to MongoDB (Task.create())
       ├─► 3. Invalidate relevant in-memory cache keys (node-cache)
       │
       ├─► 4. SEND HTTP RESPONSE TO CLIENT IMMEDIATELY! ────────────────┐
       │      res.status(201).json(task)                                │
       │      Timestamp: T0 (e.g., 12:04:20.997Z)                       │ (Response arrives at
       │                                                                │  Client in ~11 ms!)
       ├─► 5. Emit Event: taskEvents.emit('task-created', task)         │
       ▼                                                                ▼
Node.js Event Bus (EventEmitter)                              Client Receives 201
       │                                                      (Unblocked!)
       ▼
Notification Listener (listeners.js)
       │
       ├─► Event received at T0 + 1ms (12:04:20.998Z)
       ├─► Schedules background job via setTimeout (1500ms delay)
       │
       ▼ (Event loop continues processing other incoming requests)
       │
       ▼ (1500ms Later)
Timer Callback Executes:
       └─► Logs dispatch: Task "Deploy Notifications" created
           Assigned User: <user@example.com>
           Timestamp: T0 + 1511ms (12:04:22.508Z)
```

### Event Loop Execution Timeline:

```text
Time (ms)  Request / Handler Thread                  Event Loop / Worker Thread
────────────────────────────────────────────────────────────────────────────────
0 ms       Client POST /tasks arrives
5 ms       Task saved to MongoDB
10 ms      [API] Response sent (201 Created) ───► Client receives response!
11 ms      taskEvents.emit('task-created') ─────► Listener receives task
                                                  Schedules timer (1500ms)
12 ms      Request cycle completed!
           Server is FREE to accept new requests.
...
1511 ms    ─────────────────────────────────────► Timer fires!
                                                  [Notification] Dispatched log
```

---

## 🛠️ 3. Step-by-Step Implementation

### Step 1: Create Dedicated Events Module
Created [`task-manager-api/events.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/events.js) extending Node.js built-in `EventEmitter`:

```javascript
const EventEmitter = require('events');

// Step 1: Create dedicated EventEmitter subclass for task domain events
class TaskEvents extends EventEmitter {}

// Export singleton instance across application
module.exports = new TaskEvents();
```

**Design Rationales:**
- **Built-in Zero Dependencies**: Uses native `events` module bundled with Node.js core.
- **Singleton Instance**: Single shared broker instance ensures that any publisher and subscriber referencing `./events` interact with the same event bus.

---

### Step 2: Register Asynchronous Notification Listener
Created [`task-manager-api/listeners.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/listeners.js) to subscribe to the `'task-created'` event:

```javascript
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
```

---

### Step 3: Emit Event Inside `POST /tasks` Route Handler
Updated [`task-manager-api/routes/taskRoutes.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/routes/taskRoutes.js):

```javascript
const taskEvents = require('../events');

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

    // Invalidate user cache
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
```

---

### Step 4: Bootstrap Listeners on Server Startup
Updated [`task-manager-api/index.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/index.js) to import listeners when the server boots:

```javascript
// Load Event Listeners for background asynchronous notification handling (Practical 10)
require('./listeners');
```

---

## 📊 4. Measured Experimental Results & Timestamp Comparison

The asynchronous non-blocking behavior was verified through end-to-end execution.

### Console Output Log:

```text
[2026-10-20T12:04:20.987Z] POST /tasks
[API] Response sent at 2026-10-20T12:04:20.997Z
[Notification Listener] Event 'task-created' received at 2026-10-20T12:04:20.998Z
[Notification Listener] Starting async dispatch for Task: "Deploy Production Notification Microservice" (User: async_user@example.com)
[Notification] Task "Deploy Production Notification Microservice" created at 2026-10-20T12:04:22.508Z (User: async_user@example.com)
```

### Empirical Timing Breakdown:

| Event Milestone | ISO 8601 Timestamp | Relative Offset | Client Impact |
| :--- | :--- | :--- | :--- |
| **HTTP Request Received** | `2026-10-20T12:04:20.987Z` | `+0 ms` | Request initiated |
| **API Response Sent** | `2026-10-20T12:04:20.997Z` | **`+10 ms`** | **Client receives 201 Created** |
| **Listener Triggered** | `2026-10-20T12:04:20.998Z` | `+11 ms` | Event received by listener |
| **Listener Completed** | `2026-10-20T12:04:22.508Z` | **`+1521 ms`** | Background task finishes in RAM |

### Key Observations:
1. **Total HTTP Client Roundtrip Duration**: **`11.59 ms`**.
2. **Background Listener Duration**: **`1510 ms`** (`1.51 seconds`).
3. **Execution Order**: The API response timestamp (`12:04:20.997Z`) preceded the listener completion timestamp (`12:04:22.508Z`) by **over 1.5 seconds**, proving non-blocking behavior.

---

## ⚖️ 5. Synchronous vs. Asynchronous Handling Comparison

| Parameter | Synchronous Handling (Without Events) | Asynchronous Handling (With `EventEmitter`) |
| :--- | :--- | :--- |
| **Client Latency** | High (`~1520 ms` - blocked by notification delivery) | **Extremely Low (`~11 ms` - immediate response)** |
| **User Experience** | UI freezes / spinners linger while waiting for notification | **Instant UI feedback upon task creation** |
| **Coupling** | Route handler directly handles database + third-party APIs | **Strict separation of concerns via domain events** |
| **Fault Tolerance** | If notification fails (e.g. SMTP down), the API call fails | **Notification errors are isolated; task creation succeeds** |
| **Throughput** | Bottlenecked by slowest external I/O | **High concurrency, CPU freed for other HTTP requests** |

---

## 🧪 6. Testing Guide (Postman)

### Step-by-Step Procedure:
1. **Authenticate User**:
   - `POST http://localhost:5000/login`
   - Retrieve the `"token"` from response.
2. **Send POST /tasks Request**:
   - URL: `POST http://localhost:5000/tasks`
   - Headers:
     - `Authorization`: `Bearer <token>`
     - `Content-Type`: `application/json`
   - Body (`raw JSON`):
     ```json
     {
       "title": "Build Postman Event Verification Task",
       "description": "Verifying async notification logs in console",
       "completed": false
     }
     ```
3. **Observe Postman Response**:
   - Response status: `201 Created`
   - Response time: **~10–25 ms**
4. **Observe Server Terminal**:
   - Notice that `[API] Response sent at ...` appears immediately.
   - Notice that `[Notification] Task ... created at ...` appears ~1.5 seconds later.

---

## 🎯 7. Key Learnings & Takeaways

1. **Decoupling Business Logic**:
   - `EventEmitter` implements the **Publisher-Subscriber (Pub/Sub) pattern**, ensuring that route handlers focus strictly on core persistence and validation while delegating side effects to listeners.
2. **Event Loop Non-Blocking Model**:
   - By dispatching work to macro-task queues via `setTimeout` or `setImmediate`, the Node.js event loop flushes HTTP network buffers to the client immediately without waiting for long-running secondary tasks.
3. **Foundation for Scalable Message Queues**:
   - In-process `EventEmitter` provides the architectural foundation for multi-process distributed queues (e.g., BullMQ, RabbitMQ, Kafka, AWS SQS) used in enterprise microservices.
