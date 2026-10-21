# TaskFlow — Full-Stack Task Manager (Practicals 7, 8, 9, 10, 11, 12 & 13)

A full-stack Task Management application connecting a **React (Vite)** frontend with code splitting (Practical 8) to an **Express.js + MongoDB (Mongoose)** backend featuring **JWT Authentication & Input Validation** (Practical 7), **In-Memory Caching with `node-cache` & Query Optimization** (Practical 9), **Asynchronous Event-Driven Architecture with Node.js `EventEmitter`** (Practical 10), **Containerization with Docker & Docker Compose** (Practical 11), an **Automated CI/CD Pipeline with GitHub Actions** (Practical 12), and **AI API Integration with Google Gemini API** (Practical 13).

---

## 🌟 Architecture & Features

### 1. Authentication Pipeline (`POST /register` & `POST /login`)
- **Password Hashing**: Passwords are encrypted with salt rounds = 10 via `bcryptjs` before persisting to MongoDB.
- **JWT Generation**: On successful authentication, signs a JWT token with a 1-hour expiration containing the user payload (`id`, `email`).
- **Authorization Header**: Client attaches `Authorization: Bearer <token>` to all protected API calls.

### 2. Express Middleware Pipeline
```text
Client Request (Authorization: Bearer <token>)
       │
       ▼
 [Auth Middleware]       ──> Verifies JWT token ──> Sets req.user (401 if missing/invalid)
       │
       ▼
 [Validation Middleware] ──> Validates body payload (400 if title missing/invalid)
       │
       ▼
 Controller (Task Routes)
```

### 3. Input Validation
- **Registration**: Ensures email is valid and password is at least 6 characters.
- **Login**: Ensures email and password are provided.
- **Task Routes**: Rejects requests missing a non-empty `title` before database interaction.

### 4. In-Memory Caching & Query Optimization (Practical 9)
- **Shared Cache Instance**: Uses `node-cache` with `stdTTL: 60s` to cache all task lists (`all_tasks`).
- **Cache-Aside Pattern**: Checks in-memory cache before executing MongoDB queries, returning `X-Cache: HIT`.
- **Cache Invalidation**: Automatically clears cache on write operations (`POST`, `PUT`, `DELETE`) to avoid serving stale data.
- **Mongoose `.lean()`**: Queries return plain JS objects, cutting document hydration overhead.
- **Performance**: Yields a ~75% reduction in API response time (1.2 ms cached vs 4.8 ms uncached).

### 5. Asynchronous Event-Driven Architecture (Practical 10)
- **Domain Event Bus (`events.js`)**: Subclasses Node.js core `EventEmitter` to publish domain lifecycle events.
- **Decoupled Notification Listener (`listeners.js`)**: Intercepts `task-created` events to dispatch background notifications without blocking the HTTP pipeline.
- **Immediate Response Delivery**: The API returns HTTP 201 Created (~11 ms) before the notification listener finishes processing (~1500 ms).

### 6. Containerization with Docker & Docker Compose (Practical 11)
- **Multi-Container Architecture**: Orchestrates `frontend` (port 5173), `backend` (port 5000), and `mongodb` (port 27017) via `docker-compose.yml`.
- **Bridge Network**: Services communicate seamlessly over `app-network` via Docker internal DNS.
- **Persistent Storage**: MongoDB database data is preserved across restarts via the named volume `mongo-data`.
- **Single-Command Launch**: Complete stack boots with `docker compose up --build`.

### 7. Automated CI/CD Pipeline with GitHub Actions (Practical 12)
- **Declarative CI Workflow (`.github/workflows/ci.yml`)**: Automatically triggers on every push and pull request to the `main` branch.
- **Ephemeral MongoDB Service Container**: Provisions `mongo:latest` on port 27017 within the `ubuntu-latest` runner for seamless database integration testing.
- **Automated Test Suite**: Executes unit & integration tests using `jest` and `supertest` to validate `/` and `/tasks` endpoints.
- **Automated Quality Gates**: Deliberately tested failure detection (Red X on broken assertions) and successful verification on fixes (Green Checkmark).
- **Practical 12 Documentation**: See [PRACTICAL_12_DOCUMENTATION.md](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/PRACTICAL_12_DOCUMENTATION.md) for full execution logs and live GitHub run links.

### 8. AI API Integration with Google Gemini API (Practical 13)
- **Auto-Generated Task Descriptions**: Connects to the Google Gemini 1.5 Flash REST API (`POST /api/ai/generate-description`) to generate actionable descriptions from task titles.
- **Backend Key Safeguard**: The `GEMINI_API_KEY` is maintained strictly within `.env` on the server and is never exposed to client-side code.
- **Graceful Error Handling**: If an API key is missing or invalid, or if the request times out, the backend gracefully responds with `{ fallback: true }` (status 200) ensuring core task management remains uninterrupted.
- **Interactive UI Experience**: Renders the AI response in React as an editable suggestion that users can customize before adding the task.
- **Practical 13 Documentation**: See [PRACTICAL_13_DOCUMENTATION.md](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/PRACTICAL_13_DOCUMENTATION.md) for complete details.

---

## 📂 Project Structure

```
task-manager-api-24DCE106/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI workflow (Practical 12)
├── docker-compose.yml          # Multi-container orchestration (Practical 11)
├── PRACTICAL_7_DOCUMENTATION.md
├── PRACTICAL_8_DOCUMENTATION.md
├── PRACTICAL_9_DOCUMENTATION.md
├── PRACTICAL_10_DOCUMENTATION.md
├── PRACTICAL_11_DOCUMENTATION.md
├── PRACTICAL_12_DOCUMENTATION.md
├── PRACTICAL_13_DOCUMENTATION.md # AI API Integration documentation & results
├── task-manager-api/
│   ├── routes/
│   │   ├── authRoutes.js       # /register, /login
│   │   ├── taskRoutes.js       # Protected /tasks CRUD
│   │   └── aiRoutes.js         # /api/ai/generate-description (Practical 13)
│   ├── tests/
│   │   └── app.test.js         # Jest & Supertest integration tests (Practicals 12 & 13)
│   ├── models/
│   │   ├── User.js             # User Schema (email, hashed password)
│   │   └── Task.js             # Task Schema with user reference
│   ├── middleware/
│   │   ├── auth.js             # JWT Bearer token verification
│   │   ├── validate.js         # Input validation (Register, Login, Task)
│   │   ├── logger.js           # Request logging
│   │   └── errorHandler.js     # Global error handling
│   ├── routes/
│   │   ├── authRoutes.js       # /register, /login
│   │   └── taskRoutes.js       # Protected /tasks CRUD
│   ├── cache.js                # Shared in-memory node-cache instance (Practical 9)
│   ├── events.js               # Domain EventEmitter singleton (Practical 10)
│   ├── listeners.js            # Background notification listeners (Practical 10)
│   ├── Dockerfile              # Backend containerization (Practical 11)
│   ├── .dockerignore           # Excluded files for backend image
│   ├── .env                    # PORT=5000, MONGO_URI, JWT_SECRET
│   └── index.js                # App entry point with CORS, middleware & routes
└── frontend/                   # React + Vite Client
    ├── Dockerfile              # Frontend containerization (Practical 11)
    ├── .dockerignore           # Excluded files for frontend image
    └── src/
        ├── api.js              # Central API client with JWT storage & Bearer headers
        ├── components/
        │   ├── AuthForm.jsx    # Sign In & Register tabs
        │   ├── TaskForm.jsx    # Task creation input
        │   ├── TaskCard.jsx    # Minimal task card
        │   ├── TaskFilter.jsx  # Status filter tabs
        │   ├── EditTaskModal.jsx
        │   └── DeleteConfirmModal.jsx
        ├── App.jsx             # Main application orchestrator
        └── index.css           # Minimalist design system
```

---

## 📡 API Endpoints

### 🔐 Authentication Routes (Public)
| Method | Endpoint | Description | Sample Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user & hash password | `{"email": "user@example.com", "password": "password123"}` |
| `POST` | `/login` | Authenticate & return signed JWT | `{"email": "user@example.com", "password": "password123"}` |

### 📋 Task Routes (Protected with `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks for authenticated user |
| `GET` | `/tasks/:id` | Retrieve specific task by ID |
| `POST` | `/tasks` | Create new task (requires title) |
| `PUT` | `/tasks/:id` | Update task title, description, or completed status |
| `DELETE` | `/tasks/:id` | Delete task by ID |

---

## 🧪 Testing with Postman

1. **Register User**:
   - `POST http://localhost:5000/register`
   - Body (JSON): `{"email": "student@example.com", "password": "password123"}`
   - Status: `201 Created`

2. **Login & Get Token**:
   - `POST http://localhost:5000/login`
   - Body (JSON): `{"email": "student@example.com", "password": "password123"}`
   - Response: Copy the returned `"token"` string.

3. **Access Protected Tasks**:
   - `GET http://localhost:5000/tasks`
   - Headers: `Authorization: Bearer <token>`
   - Status: `200 OK`

4. **Input Validation Check**:
   - `POST http://localhost:5000/tasks`
   - Headers: `Authorization: Bearer <token>`
   - Body (JSON): `{"description": "Missing title"}`
   - Status: `400 Bad Request` (`"Task title is required and cannot be empty"`)
