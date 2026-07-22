import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF resume file first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setExtractedText('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    // Dynamically routes port 5173 -> port 8000 in GitHub Codespaces environment
    const backendUrl = window.location.origin.replace('-5173', '-8000') + '/api/upload-resume';

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server response error: ${response.status}`);
      }

      const data = await response.json();
      setExtractedText(data.extracted_text || '');
      setAnalysis(data.analysis || null);
    } catch (err) {
      console.error(err);
      setError('Failed to reach backend API. Ensure Port 8000 is active and set to Public.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>📄 AI Resume Analyzer</h1>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3>1. Upload Resume (PDF)</h3>
        <input type="file" accept=".pdf" onChange={handleFileChange} />

        <h3 style={{ marginTop: '20px' }}>2. Job Description (Optional)</h3>
        <textarea
          placeholder="Paste job description here to check keyword & skills match..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />

        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          style={{ 
            marginTop: '15px', 
            padding: '10px 20px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            background: '#0070f3', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Analyzing with Groq (Llama 3.3)...' : 'Analyze Resume'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '15px' }}>{error}</p>}

      {/* Extracted PDF Text */}
      {extractedText && (
        <div style={{ marginTop: '20px' }}>
          <h3>Extracted Content:</h3>
          <textarea 
            readOnly 
            value={extractedText} 
            rows={8} 
            style={{ width: '100%', fontFamily: 'monospace', padding: '10px', boxSizing: 'border-box' }} 
          />
        </div>
      )}

      {/* Gemini AI Breakdown Card */}
      {analysis && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #4caf50', borderRadius: '8px', background: '#f6fff6' }}>
          <h2>Score: {analysis.match_score}%</h2>
          <p><strong>Summary:</strong> {analysis.summary}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <h4 style={{ color: 'green', margin: '0 0 10px 0' }}>✅ Strengths</h4>
              <ul>
                {analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>⚠️ Missing Keywords</h4>
              <ul>
                {analysis.missing_keywords?.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          </div>

          <h4 style={{ color: '#0070f3', marginTop: '20px' }}>💡 Actionable Suggestions</h4>
          <ul>
            {analysis.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;