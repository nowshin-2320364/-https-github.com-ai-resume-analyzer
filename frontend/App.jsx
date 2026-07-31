import React, { useState, useEffect } from 'react';

export default function App() {
  // --- Form & Analysis States ---
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- CRUD History States ---
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Automatically handle Backend URL across Localhost and GitHub Codespaces
  const getBackendBaseUrl = () => {
    let url = 'http://localhost:8000';
    if (typeof window !== 'undefined' && window.location.href.includes('.app.github.dev')) {
      url = window.location.href.replace('-5173.', '-8000.').replace(/\/$/, '');
    }
    return url;
  };

  const baseUrl = getBackendBaseUrl();

  // -------------------------------------------------------------
  // 1. READ: Fetch Saved History from FastAPI Database
  // -------------------------------------------------------------
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // -------------------------------------------------------------
  // 2. CREATE (Analysis): Upload Resume & Get AI Output
  // -------------------------------------------------------------
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a PDF resume file.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setExtractedText('');
    setSaveStatus('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const res = await fetch(`${baseUrl}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to analyze resume');
      }

      const data = await res.json();
      setExtractedText(data.extracted_text || '');
      setAnalysis(data.analysis || null);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. CREATE (Database): Save Analysis Record to SQLite
  // -------------------------------------------------------------
  const handleSaveAnalysis = async () => {
    if (!analysis) return;
    try {
      const formData = new FormData();
      formData.append('filename', file?.name || 'Resume.pdf');
      formData.append('job_title', jobDescription.slice(0, 30) || 'General Analysis');
      formData.append('match_score', analysis.match_score || 0);
      formData.append('summary', analysis.summary || '');

      const res = await fetch(`${baseUrl}/api/save-analysis`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSaveStatus('Saved!');
        fetchHistory(); // Refresh history table immediately
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  // -------------------------------------------------------------
  // 4. UPDATE: Edit Job Title in Saved Analysis
  // -------------------------------------------------------------
  const handleUpdateTitle = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: editTitle }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditTitle('');
        fetchHistory();
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  // -------------------------------------------------------------
  // 5. DELETE: Remove Analysis Record from Database
  // -------------------------------------------------------------
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

  // Dynamic Score Badge Color Helper
  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981'; // Emerald Green
    if (score >= 50) return '#f59e0b'; // Amber Yellow
    return '#ef4444'; // Rose Red
  };

  return (
    <div style={styles.container}>
      {/* Global CSS Keyframe for Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>⚡ AI Resume & ATS Analyzer</h1>
        <p style={styles.subtitle}>
          Upload your resume alongside a target job description to get real-time score matching, missing keywords, and actionable tips.
        </p>
      </header>

      {/* Form Input Section */}
      <div style={styles.card}>
        <form onSubmit={handleAnalyze} style={styles.form}>
          {/* Drag & Drop PDF Dropzone */}
          <div
            style={{
              ...styles.dropzone,
              borderColor: isDragging ? '#3b82f6' : '#374151',
              backgroundColor: isDragging ? '#1e293b' : '#0f172a',
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
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Selected: {file.name}</span>
              ) : (
                <span>Drag & drop your PDF resume here, or <strong style={{ color: '#3b82f6' }}>browse</strong></span>
              )}
            </label>
          </div>

          {/* Job Description Textarea */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Job Description / Role Requirements</label>
            <textarea
              rows="5"
              placeholder="Paste the job description or keyword requirements here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={styles.textarea}
            />
          </div>

          {/* Submit Action Button */}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Analyzing Resume with Groq AI...' : '🚀 Analyze Resume'}
          </button>
        </form>

        {error && <div style={styles.errorBanner}>{error}</div>}
      </div>

      {/* Skeleton Pulse Loading Screen */}
      {loading && (
        <div style={styles.skeletonCard}>
          <div style={{ ...styles.skeletonBox, height: '40px', width: '200px' }}></div>
          <div style={{ ...styles.skeletonBox, height: '100px', marginTop: '1rem' }}></div>
          <div style={{ ...styles.skeletonBox, height: '60px', marginTop: '1rem' }}></div>
        </div>
      )}

      {/* Analysis Results Dashboard */}
      {analysis && !loading && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsHeader}>
            <div style={styles.scoreContainer}>
              <span style={styles.scoreLabel}>ATS MATCH SCORE</span>
              <span style={{ ...styles.scoreValue, color: getScoreColor(analysis.match_score) }}>
                {analysis.match_score}%
              </span>
            </div>
            <button onClick={handleSaveAnalysis} style={styles.saveBtn}>
              {saveStatus || '💾 Save Report'}
            </button>
          </div>

          <div style={styles.grid}>
            <div style={styles.gridCard}>
              <h3 style={styles.cardHeading}>Executive Summary</h3>
              <p style={styles.cardText}>{analysis.summary}</p>
            </div>

            <div style={styles.gridCard}>
              <h3 style={{ ...styles.cardHeading, color: '#10b981' }}>Identified Strengths</h3>
              <ul style={styles.list}>
                {analysis.strengths?.map((s, i) => <li key={i} style={styles.listItem}>✓ {s}</li>)}
              </ul>
            </div>

            <div style={styles.gridCard}>
              <h3 style={{ ...styles.cardHeading, color: '#f59e0b' }}>Missing Keywords</h3>
              <ul style={styles.list}>
                {analysis.missing_keywords?.map((k, i) => <li key={i} style={styles.listItem}>⚠ {k}</li>)}
              </ul>
            </div>

            <div style={styles.gridCard}>
              <h3 style={{ ...styles.cardHeading, color: '#3b82f6' }}>Actionable Suggestions</h3>
              <ul style={styles.list}>
                {analysis.suggestions?.map((s, i) => <li key={i} style={styles.listItem}>→ {s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Saved History Dashboard */}
      <div style={styles.historySection}>
        <h2 style={styles.sectionTitle}>📜 Saved Analysis History</h2>
        {history.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center' }}>No saved reports found in SQLite database.</p>
        ) : (
          <div style={styles.historyGrid}>
            {history.map((item) => (
              <div key={item.id} style={styles.historyCard}>
                <div style={{ flex: 1 }}>
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={styles.editInput}
                      />
                      <button onClick={() => handleUpdateTitle(item.id)} style={styles.smallSaveBtn}>Save</button>
                      <button onClick={() => setEditingId(null)} style={styles.smallCancelBtn}>Cancel</button>
                    </div>
                  ) : (
                    <h3 style={styles.historyTitle}>
                      {item.job_title} <span style={styles.historyFilename}>({item.filename})</span>
                    </h3>
                  )}
                  <p style={{ margin: 0, fontWeight: 'bold', color: getScoreColor(item.match_score) }}>
                    Match Score: {item.match_score}%
                  </p>
                  <small style={{ opacity: 0.5 }}>Saved: {new Date(item.created_at).toLocaleString()}</small>
                </div>

                <div style={styles.historyActions}>
                  <button
                    onClick={() => { setEditingId(item.id); setEditTitle(item.job_title); }}
                    style={styles.editBtn}
                  >
                    ✏️ Edit Title
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Styles Toolkit (Eliminates CSS dependency conflicts)
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#090d16',
    color: '#f3f4f6',
    padding: '2rem 1rem',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: { textAlign: 'center', marginBottom: '2.5rem' },
  title: { fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#ffffff' },
  subtitle: { color: '#9ca3af', maxWidth: '650px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.5' },
  card: { backgroundColor: '#111827', padding: '2rem', borderRadius: '12px', border: '1px solid #1f2937' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  dropzone: {
    border: '2px dashed #374151',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropzoneLabel: { cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  uploadIcon: { fontSize: '2rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#d1d5db' },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#fff',
    padding: '0.75rem',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: '700',
    padding: '0.85rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  errorBanner: { marginTop: '1rem', backgroundColor: '#7f1d1d', color: '#fecaca', padding: '0.75rem', borderRadius: '6px' },
  skeletonCard: { backgroundColor: '#111827', padding: '2rem', borderRadius: '12px', marginTop: '2rem', animation: 'pulse 1.5s infinite' },
  skeletonBox: { backgroundColor: '#1f2937', borderRadius: '6px' },
  resultsContainer: { marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1f2937' },
  scoreContainer: { display: 'flex', flexDirection: 'column' },
  scoreLabel: { fontSize: '0.75rem', color: '#9ca3af', fontWeight: '700', letterSpacing: '0.05em' },
  scoreValue: { fontSize: '2.5rem', fontWeight: '900' },
  saveBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  gridCard: { backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1f2937' },
  cardHeading: { margin: '0 0 0.75rem 0', fontSize: '1.1rem' },
  cardText: { fontSize: '0.95rem', color: '#d1d5db', lineHeight: '1.5', margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  listItem: { fontSize: '0.9rem', color: '#d1d5db' },
  historySection: { marginTop: '3.5rem', borderTop: '1px solid #1f2937', paddingTop: '2rem' },
  sectionTitle: { fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f3f4f6' },
  historyGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  historyCard: { backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { margin: '0 0 0.25rem 0', fontSize: '1.1rem' },
  historyFilename: { fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'normal' },
  historyActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  deleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  editInput: { backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px' },
  smallSaveBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
  smallCancelBtn: { backgroundColor: '#6b7280', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
};