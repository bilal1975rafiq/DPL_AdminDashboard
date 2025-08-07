import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        // Store token based on remember me preference
        if (rememberMe) {
          localStorage.setItem('jwt', data.token);
        } else {
          sessionStorage.setItem('jwt', data.token);
        }
        
        if (onLogin) onLogin();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        {/* Enhanced Header Section */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">🚀</div>
            <div className="login-logo-text">
              Command <span className="rebel-text">Center</span>
            </div>
          </div>
          <h2>Welcome Back</h2>
          <p className="login-subtitle">DPL admin</p>
        </div>

        {/* Username/Email Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="username">
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <div className="input-icon">👤</div>
          </div>
        </div>

        {/* Password Input with Visibility Toggle */}
        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="input-icon">🔒</div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: 0
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="remember-me">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="remember">Remember me</label>
        </div>

        {/* Submit Button with Loading State */}
        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="login-loading">
              <div className="spinner"></div>
              Signing In...
            </span>
          ) : (
            <span>Sign In</span>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <span style={{ marginRight: '0.5rem' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Forgot Password Link */}
        <div className="forgot-password">
          <a href="#forgot" onClick={(e) => {
            e.preventDefault();
            // Add your forgot password logic here
            alert('Forgot password functionality coming soon!');
          }}>
            Forgot your password?
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;