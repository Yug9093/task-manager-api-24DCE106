// Central API client for Task Manager Node+MongoDB backend with JWT Authentication
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TOKEN_KEY = 'taskflow_auth_token';
const USER_KEY = 'taskflow_auth_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const saveAuthData = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Returns authorization headers if token exists
 */
const getAuthHeaders = () => {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Standardize error handling and response parsing
 */
async function handleResponse(response, defaultErrorMessage) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthData();
    }
    const message = (data && (data.error || data.message)) || `${defaultErrorMessage} (Status ${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Register a new user
 */
export const registerUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res, 'Registration failed');
};

/**
 * Authenticate user credentials and retrieve JWT token
 */
export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res, 'Login failed');
  if (data.token) {
    saveAuthData(data.token, data.user);
  }
  return data;
};

/**
 * Retrieve all tasks from the backend (Protected)
 */
export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch tasks');
};

/**
 * Retrieve a single task by ID (Protected)
 */
export const getTaskById = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, `Failed to fetch task with ID ${id}`);
};

/**
 * Create a new task (Protected & Validated)
 */
export const createTask = async (taskData) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res, 'Failed to create task');
};

/**
 * Update an existing task by ID (Protected & Validated)
 */
export const updateTask = async (id, taskData) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res, 'Failed to update task');
};

/**
 * Delete a task by ID (Protected)
 */
export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to delete task');
};

export { BASE_URL };
