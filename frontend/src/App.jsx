import React, { useState, useEffect } from 'react';
import Login from './Login';

const API_BASE_URL = 'https://reimagined-pancake-69x7w67q9pr6c595p-8000.app.github.dev';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Fetch saved history from SQLite database when user is logged in
  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume to upload.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

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
      formData.append('job_title', 'Target Role');
      formData.append('match_score', result.match_score);
      formData.append('summary', result.summary);

      const res = await fetch(`${API_BASE_URL}/api/save-analysis`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchHistory();
        alert('Analysis saved to history!');
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: 'DELETE',
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
        headers: { 'Content-Type': 'application/json' },
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

  // ---------------------------------------------------------
  // UNAUTHENTICATED VIEW (SHOW LOGIN SCREEN)
  // ---------------------------------------------------------
  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />;
  }

  // ---------------------------------------------------------
  // AUTHENTICATED MAIN APPLICATION DASHBOARD
  // ---------------------------------------------------------
  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>✨ AI Resume Analyzer</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* App Body Container */}
      <div style={styles.mainContent}>
        {/* Upload & Form Card */}
        <div style={styles.card}>
          <form onSubmit={handleAnalyze}>
            <div style={styles.uploadZone}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                id="pdf-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="pdf-upload" style={styles.uploadLabel}>
                📄 {file ? `Selected: ${file.name}` : 'Click to select PDF Resume'}
              </label>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Job Description / Role Requirements</label>
              <textarea
                rows={5}
                placeholder="Paste the job description or keyword requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Analyzing with AI...' : '🚀 Analyze Resume'}
            </button>
          </form>

          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
        </div>

        {/* AI Results Output Card */}
        {result && (
          <div style={styles.card}>
            <div style={styles.resultHeader}>
              <h2 style={{ margin: 0 }}>Analysis Results</h2>
              <div style={styles.scoreBadge}>{result.match_score}% Match</div>
            </div>

            <p style={styles.summaryText}>
              <strong>Summary:</strong> {result.summary}
            </p>

            <div style={styles.resultGrid}>
              <div style={styles.resultSection}>
                <h4 style={{ color: '#4ade80', marginTop: 0 }}>✅ Key Strengths</h4>
                <ul style={styles.list}>
                  {result.strengths?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.resultSection}>
                <h4 style={{ color: '#f87171', marginTop: 0 }}>⚠️ Missing Keywords</h4>
                <ul style={styles.list}>
                  {result.missing_keywords?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={styles.resultSection}>
              <h4 style={{ color: '#60a5fa', marginTop: 0 }}>💡 Actionable Suggestions</h4>
              <ul style={styles.list}>
                {result.suggestions?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <button onClick={handleSaveHistory} disabled={saving} style={styles.saveBtn}>
              {saving ? 'Saving...' : '💾 Save to History'}
            </button>
          </div>
        )}

        {/* Saved History Card */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📜 Saved Analysis History</h3>
          {history.length === 0 ? (
            <div style={styles.emptyState}>
              📁 No saved reports found in SQLite database.
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((record) => (
                <div key={record.id} style={styles.historyCard}>
                  <div style={styles.historyHeader}>
                    {editId === record.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={styles.inlineInput}
                        />
                        <button
                          onClick={() => handleUpdateTitle(record.id)}
                          style={styles.smallBtn}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h4 style={{ margin: 0 }}>
                        {record.job_title} ({record.match_score}% Match)
                      </h4>
                    )}
                    <span style={styles.dateBadge}>
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={styles.historyFile}>File: {record.filename}</p>
                  <p style={styles.historySummary}>{record.summary}</p>

                  <div style={styles.historyActions}>
                    <button
                      onClick={() => {
                        setEditId(record.id);
                        setEditTitle(record.job_title);
                      }}
                      style={styles.actionBtn}
                    >
                      ✏️ Edit Title
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(record.id)}
                      style={{ ...styles.actionBtn, color: '#ef4444' }}
                    >
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

// ---------------------------------------------------------
// STYLES (DARK THEME)
// ---------------------------------------------------------
const styles = {
  container: {
    backgroundColor: '#0b0f19',
    color: '#f3f4f6',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #1f2937',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
    color: '#818cf8',
  },
  logoutBtn: {
    backgroundColor: '#374151',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  mainContent: {
    maxWidth: '800px',
    margin: '32px auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '12px',
    padding: '24px',
  },
  uploadZone: {
    border: '2px dashed #374151',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#1f2937',
  },
  uploadLabel: {
    cursor: 'pointer',
    color: '#38bdf8',
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#9ca3af',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  errorAlert: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#450a0a',
    border: '1px solid #7f1d1d',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '0.9rem',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  scoreBadge: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  summaryText: {
    color: '#d1d5db',
    lineHeight: '1.5',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    margin: '16px 0',
  },
  resultSection: {
    backgroundColor: '#1f2937',
    padding: '16px',
    borderRadius: '8px',
    margin: '8px 0',
  },
  list: {
    paddingLeft: '20px',
    margin: 0,
    color: '#d1d5db',
    lineHeight: '1.6',
  },
  saveBtn: {
    marginTop: '16px',
    width: '100%',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '16px',
    color: '#f3f4f6',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '32px 0',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyCard: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '16px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadge: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  historyFile: {
    fontSize: '0.85rem',
    color: '#38bdf8',
    margin: '4px 0',
  },
  historySummary: {
    fontSize: '0.9rem',
    color: '#d1d5db',
  },
  historyActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
  },
  inlineInput: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  smallBtn: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};