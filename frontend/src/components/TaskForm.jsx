import React, { useState } from 'react';

export default function TaskForm({ onTaskCreated, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    setError('');

    const success = await onTaskCreated({
      title: title.trim(),
      description: description.trim(),
      completed: false,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setShowDesc(false);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="simple-form">
        <input
          type="text"
          className="form-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          disabled={isSubmitting}
        />

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {showDesc ? (
          <textarea
            className="form-textarea"
            placeholder="Add details / notes (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        ) : null}

        <div className="form-actions">
          {!showDesc && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => setShowDesc(true)}
            >
              + Add notes
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>Adding...</span>
              </>
            ) : (
              'Add Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
