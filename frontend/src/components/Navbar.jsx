import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, FolderKanban, Mail, LogOut } from 'lucide-react';

export default function Navbar({ currentUser, isAuthenticated, onLogout }) {
  return (
    <header className="app-navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <NavLink to="/" className="brand-link">
            <span className="brand-logo-badge">TF</span>
            <span className="brand-name">TaskFlow</span>
          </NavLink>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CheckSquare size={16} />
            <span>Tasks</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FolderKanban size={16} />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Mail size={16} />
            <span>Contact</span>
          </NavLink>
        </nav>

        <div className="nav-user-section">
          {isAuthenticated ? (
            <div className="user-badge-wrapper">
              <span className="user-email-text" title={currentUser?.email}>
                {currentUser?.email || 'Logged In'}
              </span>
              <button
                type="button"
                className="btn-logout"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <span className="guest-badge">Guest Session</span>
          )}
        </div>
      </div>
    </header>
  );
}
