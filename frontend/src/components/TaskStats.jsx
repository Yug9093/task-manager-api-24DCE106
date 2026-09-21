import React from 'react';
import { CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react';

export default function TaskStats({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-info">
          <h4>Total Tasks</h4>
          <div className="stat-number">{total}</div>
        </div>
        <div className="stat-icon-wrapper stat-icon-total">
          <ListTodo size={22} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Completed</h4>
          <div className="stat-number">{completed}</div>
        </div>
        <div className="stat-icon-wrapper stat-icon-completed">
          <CheckCircle2 size={22} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Pending</h4>
          <div className="stat-number">{pending}</div>
        </div>
        <div className="stat-icon-wrapper stat-icon-pending">
          <Clock size={22} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Progress</h4>
          <div className="stat-number">{rate}%</div>
        </div>
        <div className="stat-icon-wrapper stat-icon-rate">
          <TrendingUp size={22} />
        </div>
      </div>
    </div>
  );
}
