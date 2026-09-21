import React from 'react';

export default function TaskFilter({
  filter,
  onFilterChange,
  counts,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <button
          type="button"
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active ({counts.active})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed ({counts.completed})
        </button>
      </div>

      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
        {counts.completed} of {counts.all} completed
      </span>
    </div>
  );
}
