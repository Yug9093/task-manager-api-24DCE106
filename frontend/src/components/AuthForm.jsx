import React, { useState } from 'react';
import { registerUser, loginUser } from '../api';

export default function AuthForm({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        await registerUser(email.trim(), password);
        setSuccess('Account created successfully! Logging you in...');
        // Automatically login after successful registration
        const loginData = await loginUser(email.trim(), password);
        onLoginSuccess(loginData.user, loginData.token);
      } else {
        const loginData = await loginUser(email.trim(), password);
        onLoginSuccess(loginData.user, loginData.token);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || (isRegister ? 'Registration failed.' : 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (registerMode) => {
    setIsRegister(registerMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: '2rem auto 0' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="filter-btn"
          style={{
            flex: 1,
            padding: '0.6rem',
            borderBottom: !isRegister ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: 0,
            fontWeight: !isRegister ? 600 : 400,
            color: !isRegister ? 'var(--text-main)' : 'var(--text-muted)'
          }}
          onClick={() => switchMode(false)}
        >
          Sign In
        </button>
        <button
          type="button"
          className="filter-btn"
          style={{
            flex: 1,
            padding: '0.6rem',
            borderBottom: isRegister ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: 0,
            fontWeight: isRegister ? 600 : 400,
            color: isRegister ? 'var(--text-main)' : 'var(--text-muted)'
          }}
          onClick={() => switchMode(true)}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="simple-form">
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Email Address
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Password {isRegister && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>(min 6 chars)</span>}
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : (
            isRegister ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}
