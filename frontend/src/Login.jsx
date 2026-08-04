import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // ⚠️ REPLACE THIS URL with your actual Port 8000 URL from the Ports tab!
  // Make sure there is NO slash (/) at the very end.
  const backendUrl = 'https://reimagined-pancake-69x7w67q9pr6c595p-8000.app.github.dev';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegistering ? '/api/register' : '/api/login';

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isRegistering) {
        alert('Account created successfully! Please log in with your credentials.');
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
      setError(err.message || 'Failed to connect to the server');
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '80px auto',
      padding: '30px',
      backgroundColor: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '12px',
      color: '#fff',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
        {isRegistering ? 'Create Account' : 'Welcome Back'}
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#450a0a',
          color: '#f87171',
          border: '1px solid #7f1d1d',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', color: '#9ca3af' }}>
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.95rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', color: '#9ca3af' }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.95rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          {isRegistering ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
        {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: '500'
          }}
        >
          {isRegistering ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}