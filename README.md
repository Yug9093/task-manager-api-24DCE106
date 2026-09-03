# TaskFlow — Full-Stack Task Manager with JWT Authentication & Input Validation (Practical 7)

A full-stack Task Management application connecting a minimal **React (Vite)** frontend to an **Express.js + MongoDB (Mongoose)** RESTful API with **JWT Authentication**, **Bcrypt password hashing**, **Input Validation middleware**, and **MongoDB persistence**.

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

---

## 📂 Project Structure

```
task-manager-api-24DCE106/
├── task-manager-api/
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
│   ├── .env                    # PORT=5000, MONGO_URI, JWT_SECRET
│   └── index.js                # App entry point with CORS, middleware & routes
└── frontend/                   # React + Vite Client
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
