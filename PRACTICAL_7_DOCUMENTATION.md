# Practical 7: JWT-Based Authentication & Input Validation in Express Middleware Pipeline

## 📌 1. Aim & Objectives
To implement **JSON Web Token (JWT) based authentication** and **server-side input validation** as part of the Express.js middleware pipeline for the Task Management application.

### Key Objectives:
1. Secure user passwords using **salted one-way hashing (`bcryptjs`)** before persisting to MongoDB.
2. Implement user registration (`POST /register`) and login (`POST /login`) flows.
3. Generate signed **JWT tokens** with a 1-hour expiration upon successful login.
4. Build custom **Authentication Middleware** that intercepts requests, validates the Bearer token, and attaches user information (`req.user`) to the request context.
5. Protect all task management endpoints (`/tasks`) so that only authenticated users can access or manipulate tasks.
6. Implement **Input Validation Middleware** that intercepts invalid or malformed requests (e.g., missing titles, invalid emails, short passwords) and returns `400 Bad Request` prior to database execution.
7. Connect the React frontend to seamlessly support login/registration, token storage in `localStorage`, and authenticated API calls.

---

## 🏗️ 2. Architectural Overview & Middleware Pipeline

### Middleware Execution Flow:
```text
Client Request (Headers: { Authorization: "Bearer <JWT_TOKEN>" }, Body: JSON)
       │
       ▼
 [cors()]                  ──> Enables cross-origin requests from React UI
       │
       ▼
 [express.json()]          ──> Parses JSON request bodies
       │
       ▼
 [loggerMiddleware]        ──> Logs HTTP method, URL, and timestamp
       │
       ▼
 [Auth Middleware]         ──> Extracts "Bearer <token>" from Authorization header
       │                       Verifies signature against JWT_SECRET
       │                       Sets req.user = decoded payload
       │                       (Throws 401 Unauthorized if missing/invalid/expired)
       │
       ▼
 [Validation Middleware]   ──> Validates presence of required fields (e.g., non-empty title)
       │                       (Throws 400 Bad Request if validation fails)
       │
       ▼
 Route Controller Handler  ──> Interacts with MongoDB via Mongoose Models (Task / User)
       │
       ▼
 Client Response           ──> Standardized JSON with appropriate HTTP Status (200 / 201 / 400 / 401 / 404 / 500)
```

---

## 🛠️ 3. Detailed Step-by-Step Implementation

### Step 1: Install Required Security Packages
Two essential security libraries were installed:
```bash
npm install bcryptjs jsonwebtoken
```
- **`bcryptjs`**: Cryptographic library to securely hash and salt passwords before storing them in MongoDB.
- **`jsonwebtoken`**: Standards-compliant library to generate (sign) and verify JSON Web Tokens.

---

### Step 2: Environment Configuration (`.env`)
The JWT secret key was configured in the environment file:
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskDB
JWT_SECRET=mySuperSecretJwtKeyTaskFlow2026!
```

---

### Step 3: User Model Schema (`models/User.js`)
Created a Mongoose User schema enforcing data integrity and unique email constraints:
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

---

### Step 4: Password Hashing & Registration (`routes/authRoutes.js`)
When a user registers:
1. Input is validated by `validateRegister` middleware.
2. The system checks if the email is already registered.
3. The plain-text password is encrypted using `bcrypt.hash(password, 10)` with a salt factor of `10`.
4. The user document is saved with the hashed password.

```javascript
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user._id, email: user.email, createdAt: user.createdAt }
    });
  } catch (err) {
    next(err);
  }
});
```

---

### Step 5: Password Comparison & JWT Token Signing (`routes/authRoutes.js`)
When a user logs in:
1. Input is validated by `validateLogin` middleware.
2. The user is located in MongoDB via email.
3. The supplied plain password is compared with the stored hash using `bcrypt.compare(password, user.password)`.
4. If valid, a signed JWT token is returned with a 1-hour expiry.

```javascript
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
});
```

---

### Step 6: Authentication Middleware (`middleware/auth.js`)
Intercepts incoming requests and verifies JWT Bearer tokens:
```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Sets user info (id, email) for subsequent handlers
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token. Authentication failed.' });
  }
};

module.exports = auth;
```

---

### Step 7: Input Validation Middleware (`middleware/validate.js`)
Performs server-side validation to reject malformed requests early:
- `validateRegister`: Verifies email format and minimum 6-character password length.
- `validateLogin`: Verifies that both email and password are provided.
- `validateTask`: Ensures `title` is present, non-empty, and valid string on `POST` and `PUT`.

```javascript
const validateTask = (req, res, next) => {
  const { title } = req.body;

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and cannot be empty'
      });
    }
  }

  if (req.method === 'PUT' && title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title cannot be empty'
      });
    }
  }

  next();
};
```

---

### Step 8: Protecting Task Routes (`routes/taskRoutes.js`)
All task routes are guarded with `router.use(auth)` and `validateTask`:
```javascript
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');

// Apply auth middleware to all task endpoints
router.use(auth);

// GET /tasks
router.get('/', async (req, res, next) => {
  const filter = req.user?.id ? { $or: [{ user: req.user.id }, { user: null }] } : {};
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// POST /tasks with validateTask
router.post('/', validateTask, async (req, res, next) => {
  const { title, description, completed } = req.body;
  const newTask = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: Boolean(completed),
    user: req.user?.id || null
  });
  res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });
});
```

---

### Step 9: React Frontend Integration
1. **`frontend/src/api.js`**:
   - Manages JWT token storage in `localStorage`.
   - Automatically injects `Authorization: Bearer <token>` on all requests.
   - Clears tokens and triggers logout if `401 Unauthorized` is returned.
2. **`frontend/src/components/AuthForm.jsx`**:
   - Minimalist form with **Sign In** and **Register** tabs.
   - Client-side validation and clear error feedback.
3. **`frontend/src/App.jsx`**:
   - Toggles between the Authentication screen and the Task Management screen depending on login state.
   - Provides user identity display and one-click Sign Out.

---

## 📡 4. REST API Endpoint Reference

| Endpoint | Method | Access | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/register` | `POST` | Public | `{"email": "...", "password": "..."}` | `201 Created` + User Object | `400 Bad Request` |
| `/login` | `POST` | Public | `{"email": "...", "password": "..."}` | `200 OK` + JWT Token | `400`, `401 Unauthorized` |
| `/tasks` | `GET` | Protected | None | `200 OK` + Tasks Array | `401 Unauthorized` |
| `/tasks/:id` | `GET` | Protected | None | `200 OK` + Task Object | `401`, `404 Not Found` |
| `/tasks` | `POST` | Protected | `{"title": "...", "description": "..."}` | `201 Created` + Task Object | `400`, `401 Unauthorized` |
| `/tasks/:id` | `PUT` | Protected | `{"title": "...", "completed": true}` | `200 OK` + Updated Task | `400`, `401`, `404` |
| `/tasks/:id` | `DELETE`| Protected | None | `200 OK` + Deleted Task | `401`, `404 Not Found` |

---

## 🧪 5. Testing & Verification

### Test Case Matrix:

| # | Scenario | Request | Expected Status | Result |
|---|---|---|---|---|
| 1 | Register without password | `POST /register` `{ email: "test@example.com" }` | `400 Bad Request` | ✅ Passed |
| 2 | Register valid user | `POST /register` `{ email: "...", password: "..." }` | `201 Created` | ✅ Passed |
| 3 | Register duplicate email | `POST /register` with same email | `400 Bad Request` | ✅ Passed |
| 4 | Login with incorrect password | `POST /login` with wrong password | `401 Unauthorized` | ✅ Passed |
| 5 | Login with correct credentials | `POST /login` with matching password | `200 OK` + JWT Token | ✅ Passed |
| 6 | Access `/tasks` without token | `GET /tasks` (No Authorization header) | `401 Unauthorized` | ✅ Passed |
| 7 | Access `/tasks` with valid token | `GET /tasks` with `Authorization: Bearer <token>` | `200 OK` | ✅ Passed |
| 8 | Create task with missing title | `POST /tasks` `{ description: "no title" }` | `400 Bad Request` | ✅ Passed |
| 9 | Create valid task with token | `POST /tasks` `{ title: "Sample Task" }` | `201 Created` | ✅ Passed |
| 10 | Browser persistence & Logout | Refresh browser & click Sign Out | Preserves session & clears on logout | ✅ Passed |

---

## 💡 6. Summary of Key Learnings & Takeaways
1. **Defense in Depth**: Password security requires salted hashes (`bcrypt`) on the server so plain-text passwords are never stored or logged.
2. **Stateless Authentication**: JWTs allow the backend to authenticate every request without maintaining server-side session state in memory.
3. **Fail-Fast Validation**: Input validation middleware catches malformed requests before hitting business logic or the database, improving performance and security.
4. **Middleware Modularization**: Separating concerns into distinct middlewares (`auth.js`, `validate.js`, `errorHandler.js`) maintains clean, readable, and maintainable Express codebases.
