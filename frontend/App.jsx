import React, { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setExtractedText('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const currentUrl = window.location.href;
      let backendUrl = 'http://localhost:8000/api/upload-resume';

      if (currentUrl.includes('.app.github.dev')) {
        backendUrl = currentUrl.replace('-5173.', '-8000.').replace(/\/$/, '') + '/api/upload-resume';
      }

      const res = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setExtractedText(data.extracted_text || '');
        setAnalysis(data.analysis || null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server. Ensure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // --- Pure React Inline Styles ---
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
    },
    wrapper: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '800',
      margin: '0 0 10px 0',
      background: 'linear-gradient(to right, #818cf8, #c084fc)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '1.1rem',
      margin: 0,
    },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#cbd5e1',
    },
    fileInputWrapper: {
      border: '2px dashed #475569',
      borderRadius: '8px',
      padding: '30px',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: '#0f172a',
      position: 'relative',
      transition: 'border-color 0.3s',
    },
    fileInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
    },
    textarea: {
      width: '100%',
      minHeight: '120px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '12px',
      color: '#f8fafc',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
    },
    buttonDisabled: {
      backgroundColor: '#475569',
      cursor: 'not-allowed',
    },
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      color: '#fca5a5',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    scoreCard: {
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      border: '1px solid #334155',
    },
    scoreValue: {
      fontSize: '3rem',
      fontWeight: '900',
      margin: '10px 0',
    },
    list: {
      listStyleType: 'none',
      padding: 0,
      margin: 0,
    },
    listItem: {
      padding: '8px 0',
      borderBottom: '1px solid #334155',
      color: '#cbd5e1',
      fontSize: '0.95rem',
      display: 'flex',
      gap: '8px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.85rem',
      margin: '4px',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: '#fcd34d',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#34d399'; // Green
    if (score >= 60) return '#fbbf24'; // Yellow
    return '#f87171'; // Red
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>AI Resume Analyzer</h1>
          <p style={styles.subtitle}>Powered by Groq API & Llama 3.3</p>
        </header>

        {/* Form Card */}
        <div style={styles.card}>
          <form onSubmit={handleAnalyze}>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>1. Upload Resume (PDF) *</label>
              <div style={styles.fileInputWrapper}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  style={styles.fileInput} 
                />
                <div style={{ pointerEvents: 'none' }}>
                  <svg style={{ width: '32px', height: '32px', fill: '#94a3b8', marginBottom: '10px' }} viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                  </svg>
                  <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 'bold' }}>
                    {file ? file.name : "Click to upload or drag & drop PDF"}
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>2. Job Description (Optional)</label>
              <textarea
                style={styles.textarea}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button 
              type="submit" 
              disabled={loading} 
              style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
            >
              {loading ? 'Analyzing with Groq...' : 'Analyze Resume'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {analysis && (
          <div>
            
            <div style={styles.grid}>
              {/* Match Score */}
              <div style={styles.scoreCard}>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>ATS Match Score</div>
                <div style={{ ...styles.scoreValue, color: getScoreColor(analysis.match_score) }}>
                  {analysis.match_score}%
                </div>
              </div>

              {/* Summary */}
              <div style={{ ...styles.card, marginBottom: 0, flex: 2 }}>
                <h3 style={{ marginTop: 0, color: '#818cf8' }}>Executive Summary</h3>
                <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>{analysis.summary}</p>
              </div>
            </div>

            <div style={styles.grid}>
              {/* Strengths */}
              <div style={styles.card}>
                <h3 style={{ marginTop: 0, color: '#34d399' }}>Identified Strengths</h3>
                <ul style={styles.list}>
                  {analysis.strengths?.map((item, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={{ color: '#34d399' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div style={styles.card}>
                <h3 style={{ marginTop: 0, color: '#818cf8' }}>Actionable Suggestions</h3>
                <ul style={styles.list}>
                  {analysis.suggestions?.map((item, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={{ color: '#818cf8' }}>→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Keywords */}
            <div style={styles.card}>
              <h3 style={{ marginTop: 0, color: '#fbbf24' }}>Missing Keywords</h3>
              <div>
                {analysis.missing_keywords?.map((kw, i) => (
                  <span key={i} style={styles.badge}>{kw}</span>
                ))}
              </div>
            </div>

            {/* Raw Text Extract */}
            {extractedText && (
              <details style={{ ...styles.card, padding: '20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#94a3b8' }}>
                  View Raw Extracted Text
                </summary>
                <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#64748b' }}>
                  {extractedText}
                </pre>
              </details>
            )}

          </div>
        )}
      </div>
    </div>
  );
}