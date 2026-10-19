import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getStoredToken,
  getStoredUser,
  clearAuthData
} from './api';
import Navbar from './components/Navbar';
import LoadingFallback from './components/LoadingFallback';

// Route-based code splitting using React.lazy()
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()));

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingTaskId, setProcessingTaskId] = useState(null);

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
    }
  };

  // Delete Task (DELETE)
  const handleDeleteTask = async (id) => {
    setErrorMessage('');
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      notifySuccess('Task deleted');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      if (err.status === 401) setIsAuthenticated(false);
      setErrorMessage(err.message || 'Failed to delete task.');
      return false;
    }
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />

        <main className="app-container">
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

          {/* Lazy-Loaded Route Components Wrapped in Suspense */}
          <Suspense fallback={<LoadingFallback message="Loading view component..." />}>
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                    tasks={tasks}
                    isLoading={isLoading}
                    isSubmitting={isSubmitting}
                    processingTaskId={processingTaskId}
                    filter={filter}
                    setFilter={setFilter}
                    onLoginSuccess={handleLoginSuccess}
                    onCreateTask={handleCreateTask}
                    onToggleStatus={handleToggleStatus}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                  />
                }
              />
              <Route
                path="/projects"
                element={<Projects tasks={tasks} />}
              />
              <Route
                path="/contact"
                element={<Contact currentUser={currentUser} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
