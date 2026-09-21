# TaskFlow — Full-Stack Task Manager (Practical 6)

A full-stack Task Management application connecting a modern **React (Vite)** frontend to an **Express.js + MongoDB (Mongoose)** RESTful API with CORS enabled, complete CRUD capabilities, and MongoDB persistence.

---

## 🌟 Key Features

1. **Full CRUD Operations via REST API**:
   - **Create**: Add new tasks with title, description, and initial completion status (`POST /tasks`).
   - **Read**: Fetch all tasks from MongoDB (`GET /tasks`) and view task metrics.
   - **Update**: Toggle completed status or edit title/description (`PUT /tasks/:id`).
   - **Delete**: Remove tasks with custom confirmation modal (`DELETE /tasks/:id`).
2. **Data Persistence**: All task actions are persisted in MongoDB. Data remains intact across browser refreshes.
3. **CORS Configured**: Express backend uses `cors` middleware to allow cross-origin requests from the React frontend.
4. **Comprehensive State Handling**:
   - Loading skeletons and per-action spinners (submitting, updating, deleting).
   - Dynamic error banners with retry mechanism.
   - Success toast alerts for seamless user feedback.
5. **Filtering & Search**:
   - Filter by **All**, **Active**, or **Completed** tasks.
   - Real-time search across titles and descriptions.
   - Dashboard metrics displaying Total Tasks, Completed, Pending, and Progress %.

---

## 📂 Project Structure

```
task-manager-api-24DCE106/
├── task-manager-api/          # Node.js + Express + MongoDB Backend
│   ├── models/
│   │   └── Task.js            # Mongoose Task schema (title, description, completed, createdAt)
│   ├── routes/
│   │   └── taskRoutes.js      # RESTful CRUD endpoints (/tasks)
│   ├── middleware/
│   │   ├── logger.js          # Request logger
│   │   └── errorHandler.js    # Global error handler
│   ├── .env                   # Environment variables (PORT=5000, MONGO_URI)
│   ├── index.js               # Express app initialization with CORS & MongoDB connection
│   └── package.json
└── frontend/                  # React + Vite Frontend
    ├── src/
    │   ├── api.js             # Central API client (getTasks, createTask, updateTask, deleteTask)
    │   ├── components/
    │   │   ├── TaskStats.jsx           # Dashboard metrics & progress
    │   │   ├── TaskForm.jsx            # Task creation form with validation
    │   │   ├── TaskCard.jsx            # Individual task card with toggle/edit/delete
    │   │   ├── TaskFilter.jsx          # Filter tabs, search bar, refresh button
    │   │   ├── EditTaskModal.jsx       # Modal for editing tasks
    │   │   ├── DeleteConfirmModal.jsx  # Confirmation dialog for task deletion
    │   │   └── AlertBanner.jsx         # Error and success notifications
    │   ├── App.jsx            # Main app orchestrating state & API calls
    │   ├── index.css          # Design system & responsive styles
    │   └── main.jsx           # Entry point
    └── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally (`mongodb://127.0.0.1:27017/taskDB`)

### 2. Start the Backend API Server
```bash
cd task-manager-api
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 3. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks from MongoDB |
| `GET` | `/tasks/:id` | Retrieve a single task by ID |
| `POST` | `/tasks` | Create a new task in MongoDB |
| `PUT` | `/tasks/:id` | Update an existing task by ID |
| `DELETE` | `/tasks/:id` | Delete a task by ID |
