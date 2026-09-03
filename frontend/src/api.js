// Central API client for Task Manager Node+MongoDB backend
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Handle API responses and standardized error extraction
 */
async function handleResponse(response, defaultErrorMessage) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `${defaultErrorMessage} (Status ${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Retrieve all tasks from the backend
 */
export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`);
  return handleResponse(res, 'Failed to fetch tasks');
};

/**
 * Retrieve a single task by ID
 */
export const getTaskById = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`);
  return handleResponse(res, `Failed to fetch task with ID ${id}`);
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  return handleResponse(res, 'Failed to create task');
};

/**
 * Update an existing task by ID
 */
export const updateTask = async (id, taskData) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  return handleResponse(res, 'Failed to update task');
};

/**
 * Delete a task by ID
 */
export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete task');
};

export { BASE_URL };
