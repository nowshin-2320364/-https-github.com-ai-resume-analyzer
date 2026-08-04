import React, { useState } from 'react';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    // Automatically transforms the frontend Codespace URL (-5173) to backend (-8000)
    return `https://${window.location.hostname.replace('-5173', '-8000')}`;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();


export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? '/api/register' : '/api/login';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isRegistering) {
        alert('Account created successfully! Please log in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          onLoginSuccess();
        } else {
          throw new Error('No access token returned');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>
        <div style={styles.badge}>SECURE PORTAL</div>
        <h2 style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p style={styles.subtitle}>
          {isRegistering ? 'Sign up to analyze and save resumes' : 'Log in to access your ATS Dashboard'}
        </p>

        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Processing...' : isRegistering ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p style={styles.switchText}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            style={styles.switchBtn}
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 0%, #131a2e 0%, #0a0e1a 55%, #070a12 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(17,24,39,0.75)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: '16px',
    padding: '32px',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#a5b4fc',
    backgroundColor: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '999px',
    padding: '4px 10px',
    display: 'inline-block',
    marginBottom: '12px',
  },
  title: { margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800 },
  subtitle: { margin: '0 0 24px 0', fontSize: '0.9rem', color: '#94a3b8' },
  errorAlert: {
    backgroundColor: 'rgba(127,29,29,0.4)',
    border: '1px solid rgba(248,113,113,0.4)',
    color: '#fecaca',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' },
  input: {
    padding: '12px',
    backgroundColor: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  primaryBtn: {
    marginTop: '8px',
    padding: '12px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  switchText: { marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 600,
  },
};
