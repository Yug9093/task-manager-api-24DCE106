import React, { useState } from 'react';
import { FolderKanban, Plus, CheckCircle2, Clock, Layers, Users, ArrowUpRight } from 'lucide-react';

export default function Projects({ tasks = [] }) {
  const [projects, setProjects] = useState([
    {
      id: 'proj-1',
      title: 'Full-Stack REST API',
      category: 'Backend & Cloud',
      description: 'Node.js, Express, MongoDB authentication and JWT middleware integration.',
      progress: 85,
      status: 'In Progress',
      color: '#3b82f6',
      teamCount: 3,
      dueDate: 'Oct 28, 2026'
    },
    {
      id: 'proj-2',
      title: 'React Performance Optimization',
      category: 'Frontend Engineering',
      description: 'Route-based code splitting, lazy loading chunks, and Suspense fallback design.',
      progress: 100,
      status: 'Completed',
      color: '#10b981',
      teamCount: 2,
      dueDate: 'Oct 18, 2026'
    },
    {
      id: 'proj-3',
      title: 'Database Indexing & Security',
      category: 'Database Architecture',
      description: 'Bcrypt password hashing, salt rounds, and user-scoped data isolation.',
      progress: 70,
      status: 'In Progress',
      color: '#8b5cf6',
      teamCount: 4,
      dueDate: 'Nov 05, 2026'
    },
    {
      id: 'proj-4',
      title: 'Automated CI/CD Pipeline',
      category: 'DevOps & Reliability',
      description: 'Automated testing suites, linting workflows, and Docker container deployment.',
      progress: 35,
      status: 'Planning',
      color: '#f59e0b',
      teamCount: 1,
      dueDate: 'Nov 19, 2026'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Development',
      description: newDesc.trim() || 'Custom project workflow.',
      progress: 10,
      status: 'In Progress',
      color: '#0ea5e9',
      teamCount: 1,
      dueDate: 'Dec 15, 2026'
    };

    setProjects([newProj, ...projects]);
    setNewTitle('');
    setNewCategory('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="projects-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Project Workspaces</h1>
          <p className="page-subtitle">
            Organize tasks into structured project milestones, track velocity, and maintain delivery deadlines.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Total Projects</h4>
            <div className="stat-number">{projects.length}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-total">
            <FolderKanban size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h4>In Progress</h4>
            <div className="stat-number">
              {projects.filter(p => p.status === 'In Progress').length}
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-pending">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h4>Completed</h4>
            <div className="stat-number">
              {projects.filter(p => p.status === 'Completed').length}
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-completed">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h4>Linked Tasks</h4>
            <div className="stat-number">{tasks.length}</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-rate">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-card-header">
              <span className="project-badge" style={{ backgroundColor: `${project.color}15`, color: project.color }}>
                {project.category}
              </span>
              <span className={`status-pill status-${project.status.toLowerCase().replace(' ', '-')}`}>
                {project.status}
              </span>
            </div>

            <h3 className="project-title">{project.title}</h3>
            <p className="project-desc">{project.description}</p>

            <div className="project-progress-section">
              <div className="progress-labels">
                <span>Progress</span>
                <span className="progress-val">{project.progress}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${project.progress}%`,
                    backgroundColor: project.color
                  }}
                />
              </div>
            </div>

            <div className="project-footer">
              <div className="project-meta-item">
                <Clock size={14} />
                <span>{project.dueDate}</span>
              </div>
              <div className="project-meta-item">
                <Users size={14} />
                <span>{project.teamCount} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project Workspace</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="simple-form">
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Next-Gen Mobile App"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cloud Infrastructure"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Objective / Description
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Summary of milestones and deliverables..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
