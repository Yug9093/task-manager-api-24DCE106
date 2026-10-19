import React, { useState } from 'react';
import AuthForm from '../components/AuthForm';
import TaskStats from '../components/TaskStats';
import TaskForm from '../components/TaskForm';
import TaskFilter from '../components/TaskFilter';
import TaskCard from '../components/TaskCard';
import EditTaskModal from '../components/EditTaskModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Home({
  currentUser,
  isAuthenticated,
  tasks,
  isLoading,
  isSubmitting,
  processingTaskId,
  filter,
  setFilter,
  onLoginSuccess,
  onCreateTask,
  onToggleStatus,
  onUpdateTask,
  onDeleteTask
}) {
  const [editingTask, setEditingTask] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditSubmit = async (id, taskData) => {
    setIsUpdating(true);
    const success = await onUpdateTask(id, taskData);
    setIsUpdating(false);
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    const success = await onDeleteTask(deletingTask._id);
    setIsDeleting(false);
    if (success) setDeletingTask(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-page-wrapper">
        <AuthForm onLoginSuccess={onLoginSuccess} />
      </div>
    );
  }

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
    <div className="home-page">
      <div className="page-header">
        <h1 className="page-title">Personal Task Dashboard</h1>
        <p className="page-subtitle">
          Manage, prioritize, and track your daily activities with instant cloud synchronization.
        </p>
      </div>

      <TaskStats tasks={tasks} />

      <TaskForm onTaskCreated={onCreateTask} isSubmitting={isSubmitting} />

      <TaskFilter
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      <div className="tasks-list-container">
        {isLoading ? (
          <div className="empty-state">
            <span className="spinner" />
            <p>Loading your tasks securely...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No tasks found</p>
            <p className="empty-state-subtitle">
              {filter === 'all'
                ? 'Your task list is clean. Add your first task above!'
                : `No ${filter} tasks right now.`}
            </p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggleStatus={onToggleStatus}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
                isProcessing={processingTaskId === task._id}
              />
            ))}
          </div>
        )}
      </div>

      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onUpdate={handleEditSubmit}
        isUpdating={isUpdating}
      />

      <DeleteConfirmModal
        task={deletingTask}
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
