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

    // Fallback prompt if the user leaves the box empty
    const finalJobDesc = jobDescription.trim() 
      ? jobDescription 
      : "General analysis. No specific job description provided. Please evaluate this resume for general best practices, overall strengths, and missing common keywords.";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', finalJobDesc); // Send the fallback if empty

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
<<<<<<< HEAD
        throw new Error(data.detail || 'Failed to analyze resume.');
=======
        const errData = await res.json();
        // Fallback error parsing just in case FastAPI returns a validation array
        if (errData.detail && Array.isArray(errData.detail)) {
            const messages = errData.detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`);
            throw new Error(messages.join(', '));
        }
        throw new Error(errData.detail || 'Failed to analyze resume');
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
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
<<<<<<< HEAD
        fetchHistory();
        alert('Analysis saved to history!');
      } else {
        alert('Failed to save analysis.');
=======
        setSaveStatus('Saved!');
        fetchHistory();
        setTimeout(() => setSaveStatus(''), 3000);
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
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

<<<<<<< HEAD
  // ---------------------------------------------------------
  // UNAUTHENTICATED VIEW (SHOW LOGIN SCREEN)
  // ---------------------------------------------------------
  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />;
  }
=======
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/history/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  };

  const getScoreGradient = (score) => {
    if (score >= 75) return 'linear-gradient(135deg, #10b981, #34d399)';
    if (score >= 50) return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(135deg, #ef4444, #f87171)';
  };
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5

  // ---------------------------------------------------------
  // AUTHENTICATED MAIN APPLICATION DASHBOARD
  // ---------------------------------------------------------
  return (
<<<<<<< HEAD
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
=======
    <div style={styles.page}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowMove { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-20px); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .glass-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .glass-card:hover { transform: translateY(-3px); border-color: rgba(99,102,241,0.45); box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
        .primary-btn { transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99,102,241,0.45); filter: brightness(1.08); }
        .primary-btn:active:not(:disabled) { transform: translateY(0px) scale(0.98); }
        .icon-btn { transition: transform 0.15s ease, filter 0.2s ease; }
        .icon-btn:hover { transform: translateY(-1px); filter: brightness(1.15); }
        .dropzone-hover:hover { border-color: #818cf8 !important; }
        .history-row { transition: background 0.2s ease, border-color 0.2s ease; }
        .history-row:hover { border-color: rgba(129,140,248,0.5); background: rgba(30,41,59,0.55); }
        input::placeholder, textarea::placeholder { color: #64748b; }
        textarea:focus, input:focus { outline: none; border-color: #818cf8 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }
      `}</style>

      <div style={styles.bgGlowTop}></div>
      <div style={styles.bgGlowBottom}></div>

      <div style={styles.container}>
        <header style={styles.header} className="fade-up">
          <div style={styles.badge}>AI-POWERED · ATS ENGINE</div>
          <h1 style={styles.title}>Resume &amp; ATS Analyzer</h1>
          <p style={styles.subtitle}>
            Upload your resume alongside a target job description to get real-time score matching, missing keywords, and actionable tips.
          </p>
        </header>

        <div style={styles.card} className="glass-card fade-up">
          <form onSubmit={handleAnalyze} style={styles.form}>
            <div
              className="dropzone-hover"
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
                <div style={styles.uploadIcon}>📄</div>
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
              <label style={styles.label}>Job Description / Role Requirements</label>
              <textarea
                rows="5"
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
                placeholder="Paste the job description or keyword requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>

<<<<<<< HEAD
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
=======
            <button type="submit" disabled={loading} className="primary-btn" style={styles.button}>
              {loading ? (
                <span style={styles.btnLoadingWrap}>
                  <span style={styles.spinner}></span>
                  Analyzing Resume with Groq AI...
                </span>
              ) : (
                '🚀 Analyze Resume'
              )}
            </button>
          </form>

          {error && <div style={styles.errorBanner}>⚠️ {error}</div>}
        </div>

        {loading && (
          <div style={styles.skeletonCard} className="fade-up">
            <div style={{ ...styles.skeletonBox, height: '40px', width: '220px' }}></div>
            <div style={{ ...styles.skeletonBox, height: '100px', marginTop: '1rem' }}></div>
            <div style={{ ...styles.skeletonBox, height: '60px', marginTop: '1rem' }}></div>
          </div>
        )}

        {analysis && !loading && (
          <div style={styles.resultsContainer} className="fade-up">
            <div style={styles.resultsHeader} className="glass-card">
              <div style={styles.scoreContainer}>
                <span style={styles.scoreLabel}>ATS MATCH SCORE</span>
                <div style={styles.scoreRow}>
                  <div style={{
                    ...styles.scoreRing,
                    background: `conic-gradient(${getScoreColor(analysis.match_score)} ${analysis.match_score * 3.6}deg, rgba(148,163,184,0.15) 0deg)`,
                  }}>
                    <div style={styles.scoreRingInner}>
                      <span style={{ ...styles.scoreValue, color: getScoreColor(analysis.match_score) }}>
                        {analysis.match_score}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleSaveAnalysis} className="primary-btn icon-btn" style={styles.saveBtn}>
                {saveStatus || '💾 Save Report'}
              </button>
            </div>

            <div style={styles.grid}>
              <div style={styles.gridCard} className="glass-card">
                <h3 style={styles.cardHeading}>📝 Executive Summary</h3>
                <p style={styles.cardText}>{analysis.summary}</p>
              </div>

              <div style={styles.gridCard} className="glass-card">
                <h3 style={{ ...styles.cardHeading, color: '#34d399' }}>✅ Identified Strengths</h3>
                <ul style={styles.list}>
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} style={{ ...styles.listItem, ...styles.pillGreen }}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.gridCard} className="glass-card">
                <h3 style={{ ...styles.cardHeading, color: '#fbbf24' }}>⚠️ Missing Keywords</h3>
                <ul style={styles.list}>
                  {analysis.missing_keywords?.map((k, i) => (
                    <li key={i} style={{ ...styles.listItem, ...styles.pillAmber }}>{k}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.gridCard} className="glass-card">
                <h3 style={{ ...styles.cardHeading, color: '#818cf8' }}>💡 Actionable Suggestions</h3>
                <ul style={styles.list}>
                  {analysis.suggestions?.map((s, i) => (
                    <li key={i} style={{ ...styles.listItem, ...styles.pillIndigo }}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div style={styles.historySection}>
          <h2 style={styles.sectionTitle}>📜 Saved Analysis History</h2>
          {history.length === 0 ? (
            <div style={styles.emptyState} className="glass-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗂️</div>
              <p style={{ opacity: 0.6, margin: 0 }}>No saved reports found in SQLite database.</p>
            </div>
          ) : (
            <div style={styles.historyGrid}>
              {history.map((item) => (
                <div key={item.id} style={styles.historyCard} className="glass-card history-row">
                  <div style={{ flex: 1 }}>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
<<<<<<< HEAD
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
=======
                          style={styles.editInput}
                        />
                        <button onClick={() => handleUpdateTitle(item.id)} className="icon-btn" style={styles.smallSaveBtn}>Save</button>
                        <button onClick={() => setEditingId(null)} className="icon-btn" style={styles.smallCancelBtn}>Cancel</button>
                      </div>
                    ) : (
                      <h3 style={styles.historyTitle}>
                        {item.job_title} <span style={styles.historyFilename}>({item.filename})</span>
                      </h3>
                    )}
                    <p style={{ margin: 0, fontWeight: 700, color: getScoreColor(item.match_score) }}>
                      Match Score: {item.match_score}%
                    </p>
                    <small style={{ opacity: 0.5 }}>Saved: {new Date(item.created_at).toLocaleString()}</small>
                  </div>

                  <div style={styles.historyActions}>
                    <button
                      onClick={() => { setEditingId(item.id); setEditTitle(item.job_title); }}
                      className="icon-btn"
                      style={styles.editBtn}
                    >
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="icon-btn" style={styles.deleteBtn}>
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
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
<<<<<<< HEAD
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
=======
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 0%, #131a2e 0%, #0a0e1a 55%, #070a12 100%)',
    color: '#f3f4f6',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflowX: 'hidden',
  },
  bgGlowTop: {
    position: 'fixed', top: '-10%', left: '-5%', width: '420px', height: '420px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)',
    filter: 'blur(40px)', pointerEvents: 'none', animation: 'glowMove 12s ease-in-out infinite',
  },
  bgGlowBottom: {
    position: 'fixed', bottom: '-15%', right: '-10%', width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)',
    filter: 'blur(50px)', pointerEvents: 'none', animation: 'glowMove 14s ease-in-out infinite reverse',
  },
  container: { position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.25rem 4rem' },
  header: { textAlign: 'center', marginBottom: '2.5rem' },
  badge: {
    display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
    color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)',
    borderRadius: '999px', padding: '0.35rem 0.9rem', marginBottom: '1rem',
  },
  title: {
    fontSize: '2.75rem', fontWeight: 800, margin: '0 0 0.6rem 0',
    background: 'linear-gradient(135deg, #ffffff 20%, #c7d2fe 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: { color: '#94a3b8', maxWidth: '620px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 },
  card: {
    backgroundColor: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    padding: '2rem', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  dropzone: { border: '2px dashed rgba(148,163,184,0.25)', borderRadius: '12px', padding: '2.25rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' },
  dropzoneLabel: { cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' },
  uploadIcon: { fontSize: '2.2rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1' },
  textarea: {
    backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px',
    color: '#fff', padding: '0.85rem', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
  },
  button: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700,
    padding: '0.9rem', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem',
  },
  btnLoadingWrap: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' },
  spinner: {
    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
    borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },
  errorBanner: {
    marginTop: '1rem', backgroundColor: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.35)',
    color: '#fecaca', padding: '0.8rem 1rem', borderRadius: '10px',
  },
  skeletonCard: {
    backgroundColor: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(16px)', padding: '2rem',
    borderRadius: '16px', marginTop: '2rem', border: '1px solid rgba(148,163,184,0.12)', animation: 'pulse 1.5s infinite',
  },
  skeletonBox: { backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: '8px' },
  resultsContainer: { marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resultsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
    backgroundColor: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(16px)', padding: '1.75rem',
    borderRadius: '16px', border: '1px solid rgba(148,163,184,0.15)',
  },
  scoreContainer: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  scoreLabel: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  scoreRing: {
    width: '84px', height: '84px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  scoreRingInner: {
    width: '66px', height: '66px', borderRadius: '50%', backgroundColor: '#0f1424',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  scoreValue: { fontSize: '1.25rem', fontWeight: 900 },
  saveBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none',
    padding: '0.7rem 1.3rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.1rem' },
  gridCard: {
    backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(14px)', padding: '1.4rem',
    borderRadius: '14px', border: '1px solid rgba(148,163,184,0.14)',
  },
  cardHeading: { margin: '0 0 0.9rem 0', fontSize: '1.05rem', color: '#e5e7eb' },
  cardText: { fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  listItem: { fontSize: '0.88rem', padding: '0.5rem 0.7rem', borderRadius: '8px' },
  pillGreen: { backgroundColor: 'rgba(16,185,129,0.1)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.2)' },
  pillAmber: { backgroundColor: 'rgba(245,158,11,0.1)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.2)' },
  pillIndigo: { backgroundColor: 'rgba(99,102,241,0.1)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.2)' },
  historySection: { marginTop: '3.5rem', borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: '2rem' },
  sectionTitle: { fontSize: '1.4rem', marginBottom: '1.5rem', color: '#f3f4f6', fontWeight: 700 },
  emptyState: {
    backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(14px)', borderRadius: '14px',
    border: '1px solid rgba(148,163,184,0.14)', padding: '2.5rem', textAlign: 'center',
  },
  historyGrid: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  historyCard: {
    backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(14px)', padding: '1.25rem 1.4rem',
    borderRadius: '14px', border: '1px solid rgba(148,163,184,0.14)', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
  },
  historyTitle: { margin: '0 0 0.3rem 0', fontSize: '1.05rem', color: '#e5e7eb' },
  historyFilename: { fontSize: '0.82rem', color: '#94a3b8', fontWeight: 400 },
  historyActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  deleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  editInput: { backgroundColor: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.3)', color: '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px' },
  smallSaveBtn: { backgroundColor: '#059669', color: '#fff', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  smallCancelBtn: { backgroundColor: '#475569', color: '#fff', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
};