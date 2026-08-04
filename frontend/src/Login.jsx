import React, { useState } from 'react';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    return `https://${window.location.hostname.replace('-5173', '-8000')}`;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

export default function Login({ onLoginSuccess }) {
  const [step, setStep] = useState('auth'); // 'auth' | '2fa_prompt' | '2fa_setup' | '2fa_verify'
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initial Form Submit (Login / Register)
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
        // Handle Login response
        if (data.requires_2fa) {
          // User already has 2FA enabled, ask for OTP code
          setStep('2fa_verify');
        } else if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          // Ask if the user wants to enable 2FA
          setStep('2fa_prompt');
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

  // 2FA Verification during login
  const handleVerifyLogin2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: totpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '2FA Verification failed');
      }

      localStorage.setItem('token', data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  // Start 2FA setup process
  const start2faSetup = async () => {
    setError('');
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to initialize 2FA setup.');
      }

      setSetupData(data);
      setStep('2fa_setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code and enable 2FA
  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: totpCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed');
      }

      alert('Two-Factor Authentication successfully enabled!');
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Login / Register Form
  if (step === 'auth') {
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

  // Render Step 2: 2FA Prompt ("Add 2FA?")
  if (step === '2fa_prompt') {
    return (
      <div style={styles.outerContainer}>
        <div style={styles.card}>
          <div style={{ ...styles.badge, backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}>
            🛡️ SECURITY ENHANCEMENT
          </div>
          <h2 style={styles.title}>Enable 2FA?</h2>
          <p style={styles.subtitle}>
            Would you like to set up Two-Factor Authentication (2FA) using an authenticator app for enhanced account protection?
          </p>

          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

          <div style={styles.actionGroup}>
            <button
              type="button"
              onClick={start2faSetup}
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? 'Initializing...' : '🔒 Yes, Enable 2FA'}
            </button>

            <button
              type="button"
              onClick={() => onLoginSuccess()}
              style={styles.secondaryBtn}
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 3: 2FA Setup (QR Code + Verification Code)
  if (step === '2fa_setup') {
    const qrUrl = setupData ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauth_url)}` : '';

    return (
      <div style={styles.outerContainer}>
        <div style={styles.card}>
          <div style={styles.badge}>2FA SETUP</div>
          <h2 style={styles.title}>Scan QR Code</h2>
          <p style={styles.subtitle}>
            Scan this image with Google Authenticator, Authy, or your password manager.
          </p>

          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

          {qrUrl && (
            <div style={styles.qrContainer}>
              <img src={qrUrl} alt="2FA QR Code" style={styles.qrImage} />
              <div style={styles.secretBox}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Manual Key:</span>
                <code style={styles.secretText}>{setupData?.secret}</code>
              </div>
            </div>
          )}

          <form onSubmit={handleEnable2FA} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Enter 6-digit Authenticator Code</label>
              <input
                type="text"
                required
                maxLength="6"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ ...styles.input, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>

            <button
              type="button"
              onClick={() => onLoginSuccess()}
              style={styles.secondaryBtn}
            >
              Skip &amp; Continue to Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Step 4: 2FA Verification during standard Login
  if (step === '2fa_verify') {
    return (
      <div style={styles.outerContainer}>
        <div style={styles.card}>
          <div style={styles.badge}>🔒 2FA REQUIRED</div>
          <h2 style={styles.title}>Two-Factor Authentication</h2>
          <p style={styles.subtitle}>
            Enter the 6-digit verification code from your authenticator app.
          </p>

          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

          <form onSubmit={handleVerifyLogin2FA} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Verification Code</label>
              <input
                type="text"
                required
                maxLength="6"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ ...styles.input, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('auth');
                setTotpCode('');
                setError('');
              }}
              style={styles.secondaryBtn}
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
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
  subtitle: { margin: '0 0 24px 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.4' },
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
  secondaryBtn: {
    padding: '10px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.15)',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#fff',
    padding: '8px',
  },
  secretBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  secretText: {
    color: '#a5b4fc',
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
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
