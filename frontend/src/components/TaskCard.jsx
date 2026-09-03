import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  isProcessing,
}) {
  const { _id, title, description, completed } = task;

  return (
    <div className={`task-item ${completed ? 'is-done' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={completed}
        onChange={() => onToggleStatus(task)}
        disabled={isProcessing}
        title={completed ? 'Mark as pending' : 'Mark as completed'}
      />

      <div className="task-content">
        <div className={`task-title ${completed ? 'done' : ''}`}>{title}</div>
        {description && <div className="task-desc">{description}</div>}
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="btn-icon"
          onClick={() => onEdit(task)}
          disabled={isProcessing}
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          type="button"
          className="btn-icon delete-btn"
          onClick={() => onDelete(task)}
          disabled={isProcessing}
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
