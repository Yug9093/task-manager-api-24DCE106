import React, { useState, useEffect, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getStoredToken,
  getStoredUser,
  clearAuthData
} from './api';
import AuthForm from './components/AuthForm';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';
import TaskFilter from './components/TaskFilter';
import EditTaskModal from './components/EditTaskModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()));

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingTaskId, setProcessingTaskId] = useState(null);

  const [editingTask, setEditingTask] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const notifySuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleLogout = () => {
    clearAuthData();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTasks([]);
    notifySuccess('Logged out successfully');
  };

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setErrorMessage('');
    notifySuccess('Signed in successfully');
  };

  // Fetch all tasks from MongoDB backend for the authenticated user
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await getTasks();
      if (response && Array.isArray(response.data)) {
        setTasks(response.data);
      } else if (Array.isArray(response)) {
        setTasks(response);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (err.status === 401) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setErrorMessage('Your session has expired. Please sign in again.');
      } else {
        setErrorMessage(
          err.message || 'Could not connect to backend server. Make sure MongoDB and Node server are running.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, fetchTasks]);

  // Create Task (POST)
  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await createTask(taskData);
      const newTask = response.data || response;
      setTasks((prev) => [newTask, ...prev]);
      notifySuccess('Task added');
      return true;
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.status === 401) {
        setIsAuthenticated(false);
      }
      setErrorMessage(err.message || 'Failed to create task.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Complete (PUT)
  const handleToggleStatus = async (task) => {
    setProcessingTaskId(task._id);
    setErrorMessage('');
    const newStatus = !task.completed;

    try {
      const response = await updateTask(task._id, {
        title: task.title,
        description: task.description,
        completed: newStatus,
      });

      const updated = response.data || response;
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, ...updated, completed: newStatus } : t))
      );
    } catch (err) {
      console.error('Error updating task:', err);
      if (err.status === 401) setIsAuthenticated(false);
      setErrorMessage(err.message || 'Failed to update task.');
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Update Task Details (PUT)
  const handleUpdateTask = async (id, taskData) => {
    setIsUpdating(true);
    setErrorMessage('');
    try {
      const response = await updateTask(id, taskData);
      const updated = response.data || response;
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, ...updated } : t))
      );
      notifySuccess('Task updated');
      return true;
    } catch (err) {
      console.error('Error saving task:', err);
      if (err.status === 401) setIsAuthenticated(false);
      setErrorMessage(err.message || 'Failed to save changes.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete (DELETE)
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    const id = deletingTask._id;
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      notifySuccess('Task deleted');
      setDeletingTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      if (err.status === 401) setIsAuthenticated(false);
      setErrorMessage(err.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const counts = {
    all: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  };

  return (
    <div className="app-container">
      {/* Simple Header */}
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 className="brand-title" style={{ textAlign: 'left' }}>Tasks</h1>
            <p className="brand-subtitle" style={{ textAlign: 'left' }}>
              JWT Authenticated • Node + MongoDB
            </p>
          </div>

          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {currentUser?.email && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {currentUser.email}
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Error & Success Alerts */}
      {errorMessage && (
        <div className="alert alert-danger">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setErrorMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span>{successMessage}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Authentication Screen or Task App */}
      {!isAuthenticated ? (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Task Creation Input */}
          <TaskForm
            onTaskCreated={handleCreateTask}
            isSubmitting={isSubmitting}
          />

          {/* Filter Tabs */}
          {tasks.length > 0 && (
            <TaskFilter
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          )}

          {/* Task List or Empty/Loading States */}
          {isLoading ? (
            <div className="state-box">
              <div className="spinner" style={{ marginBottom: '0.5rem' }} />
              <div>Loading tasks...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="state-box">
              No tasks yet. Add your first task above.
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="state-box">
              No {filter} tasks.
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggleStatus={handleToggleStatus}
                  onEdit={setEditingTask}
                  onDelete={setDeletingTask}
                  isProcessing={processingTaskId === task._id}
                />
              ))}
            </div>
          )}

          {/* Edit Modal */}
          <EditTaskModal
            task={editingTask}
            isOpen={Boolean(editingTask)}
            onClose={() => setEditingTask(null)}
            onUpdate={handleUpdateTask}
            isUpdating={isUpdating}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={Boolean(deletingTask)}
            taskTitle={deletingTask?.title || ''}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingTask(null)}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
}
