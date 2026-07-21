import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF file first!');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedText('');

    const formData = new FormData();
    formData.append('file', file);

    // Dynamic backend URL based on current Codespaces host name
    const backendUrl = window.location.origin.replace('-5173', '-8000') + '/api/upload-resume';

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      setExtractedText(data.extracted_text || 'No text could be extracted.');
    } catch (err) {
      console.error("Fetch Error:", err);
      setError('Failed to fetch from backend. Check browser console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>📄 AI Resume Analyzer</h1>

      <div style={{ margin: '20px 0', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {extractedText && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h3>Extracted Content:</h3>
          <textarea
            readOnly
            value={extractedText}
            rows={15}
            style={{ width: '100%', padding: '10px', fontFamily: 'monospace' }}
          />
        </div>
      )}
    </div>
  );
}

export default App;