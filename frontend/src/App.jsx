import React, { useState, useEffect } from 'react';
import Login from './Login';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    // Automatically transforms the frontend Codespace URL (-5173) to backend (-8000)
    return `https://${window.location.hostname.replace('-5173', '-8000')}`;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume to upload.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription.trim());

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to analyze resume.');
      }
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('filename', file ? file.name : 'resume.pdf');
      formData.append('job_title', jobDescription.trim() ? 'Target Role' : 'General Analysis');
      formData.append('match_score', result.match_score);
      formData.append('summary', result.summary);

      const res = await fetch(`${API_BASE_URL}/api/save-analysis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setSaveStatus('Saved!');
        fetchHistory();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        alert('Failed to save analysis.');
      }
    } catch (err) {
      alert('Error saving analysis: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHistory(history.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const handleUpdateTitle = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_title: editTitle }),
      });
      if (res.ok) {
        setEditId(null);
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  };

  // Render Login screen if not authenticated
  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowTop}></div>
      <div style={styles.bgGlowBottom}></div>

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.badge}>AI-POWERED · ATS ENGINE</div>
            <h1 style={styles.title}>Resume &amp; ATS Analyzer</h1>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </header>

        {/* Upload Card */}
        <div style={styles.card}>
          <form onSubmit={handleAnalyze} style={styles.form}>
            <div
              style={{
                ...styles.dropzone,
                borderColor: isDragging ? '#818cf8' : 'rgba(148,163,184,0.25)',
                backgroundColor: isDragging ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.4)',
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="pdf-upload" style={styles.dropzoneLabel}>
                <div style={{ fontSize: '2rem' }}>📄</div>
                {file ? (
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Selected: {file.name}</span>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>
                    Drag &amp; drop your PDF resume here, or <strong style={{ color: '#818cf8' }}>browse</strong>
                  </span>
                )}
              </label>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Job Description / Role Requirements <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                rows="5"
                placeholder="Paste the job description or keyword requirements here (optional - leave blank for general review)..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Analyzing with AI...' : '🚀 Analyze Resume'}
            </button>
          </form>

          {error && <div style={styles.errorBanner}>⚠️ {error}</div>}
        </div>

        {/* Results Card */}
        {result && (
          <div style={styles.resultsContainer}>
            <div style={styles.resultsHeader}>
              <div>
                <span style={styles.scoreLabel}>ATS MATCH SCORE</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: getScoreColor(result.match_score) }}>
                  {result.match_score}%
                </div>
              </div>
              <button onClick={handleSaveHistory} disabled={saving} style={styles.saveBtn}>
                {saveStatus || (saving ? 'Saving...' : '💾 Save Report')}
              </button>
            </div>

            <div style={styles.grid}>
              <div style={styles.gridCard}>
                <h3 style={styles.cardHeading}>📝 Summary</h3>
                <p style={styles.cardText}>{result.summary}</p>
              </div>

              <div style={styles.gridCard}>
                <h3 style={{ ...styles.cardHeading, color: '#34d399' }}>✅ Strengths</h3>
                <ul style={styles.list}>
                  {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={styles.gridCard}>
                <h3 style={{ ...styles.cardHeading, color: '#fbbf24' }}>⚠️ Missing Keywords</h3>
                <ul style={styles.list}>
                  {result.missing_keywords?.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </div>

              <div style={styles.gridCard}>
                <h3 style={{ ...styles.cardHeading, color: '#818cf8' }}>💡 Suggestions</h3>
                <ul style={styles.list}>
                  {result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        <div style={styles.historySection}>
          <h2 style={styles.sectionTitle}>📜 Saved Analysis History</h2>
          {history.length === 0 ? (
            <div style={styles.emptyState}>No saved reports found in database.</div>
          ) : (
            <div style={styles.historyGrid}>
              {history.map((item) => (
                <div key={item.id} style={styles.historyCard}>
                  <div style={{ flex: 1 }}>
                    {editId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={styles.editInput}
                        />
                        <button onClick={() => handleUpdateTitle(item.id)} style={styles.smallSaveBtn}>Save</button>
                        <button onClick={() => setEditId(null)} style={styles.smallCancelBtn}>Cancel</button>
                      </div>
                    ) : (
                      <h3 style={styles.historyTitle}>
                        {item.job_title} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({item.filename})</span>
                      </h3>
                    )}
                    <p style={{ margin: 0, fontWeight: 700, color: getScoreColor(item.match_score) }}>
                      Match Score: {item.match_score}%
                    </p>
                    <small style={{ opacity: 0.5 }}>Saved: {new Date(item.created_at).toLocaleString()}</small>
                  </div>

                  <div style={styles.historyActions}>
                    <button onClick={() => { setEditId(item.id); setEditTitle(item.job_title); }} style={styles.editBtn}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteHistory(item.id)} style={styles.deleteBtn}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 0%, #131a2e 0%, #0a0e1a 55%, #070a12 100%)',
    color: '#f3f4f6',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  bgGlowTop: {
    position: 'fixed', top: '-10%', left: '-5%', width: '420px', height: '420px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)',
    filter: 'blur(40px)', pointerEvents: 'none',
  },
  bgGlowBottom: {
    position: 'fixed', bottom: '-15%', right: '-10%', width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)',
    filter: 'blur(50px)', pointerEvents: 'none',
  },
  container: { position: 'relative', maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  badge: {
    fontSize: '0.7rem', fontWeight: 700, color: '#a5b4fc',
    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)',
    borderRadius: '999px', padding: '2px 8px', width: 'fit-content',
  },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0 },
  logoutBtn: {
    backgroundColor: '#374151', color: '#fff', border: 'none',
    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(16px)',
    padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.15)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropzone: { border: '2px dashed rgba(148,163,184,0.25)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer' },
  dropzoneLabel: { cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1' },
  textarea: {
    backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px',
    color: '#fff', padding: '0.85rem', fontSize: '0.95rem', outline: 'none', resize: 'vertical',
  },
  button: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700,
    padding: '0.9rem', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem',
  },
  errorBanner: {
    marginTop: '1rem', backgroundColor: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.35)',
    color: '#fecaca', padding: '0.8rem 1rem', borderRadius: '10px',
  },
  resultsContainer: { marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  resultsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.55)', padding: '1.25rem', borderRadius: '16px',
    border: '1px solid rgba(148,163,184,0.15)',
  },
  scoreLabel: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 },
  saveBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none',
    padding: '0.7rem 1.3rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  gridCard: {
    backgroundColor: 'rgba(17,24,39,0.5)', padding: '1.2rem', borderRadius: '14px',
    border: '1px solid rgba(148,163,184,0.14)',
  },
  cardHeading: { margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e5e7eb' },
  cardText: { fontSize: '0.9rem', color: '#cbd5e1', margin: 0 },
  list: { paddingLeft: '1.2rem', margin: 0, color: '#cbd5e1', fontSize: '0.88rem' },
  historySection: { marginTop: '3rem', borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: '1.5rem' },
  sectionTitle: { fontSize: '1.3rem', marginBottom: '1rem' },
  emptyState: { backgroundColor: 'rgba(17,24,39,0.5)', padding: '2rem', textAlign: 'center', borderRadius: '12px' },
  historyGrid: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  historyCard: {
    backgroundColor: 'rgba(17,24,39,0.5)', padding: '1rem 1.2rem', borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  historyTitle: { margin: '0 0 0.2rem 0', fontSize: '1rem' },
  historyActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' },
  editInput: { backgroundColor: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.3)', color: '#fff', padding: '0.3rem 0.5rem', borderRadius: '4px' },
  smallSaveBtn: { backgroundColor: '#059669', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
  smallCancelBtn: { backgroundColor: '#475569', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
};
