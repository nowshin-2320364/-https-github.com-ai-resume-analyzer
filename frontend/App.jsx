import React, { useState } from 'react';

export default function App() {
  // States hold information that can change on the screen
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // This runs when the user selects a file from their computer
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // This runs when the user clicks the "Upload & Analyze" button
  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");

    setLoading(true); // Start a loading indicator

    // Prepare the file data to be sent across the internet
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Connect directly to the Backend route we made in Phase 1
      const response = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      setResult(data.extracted_text); // Save the extracted text to show on screen
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false); // Stop the loading indicator
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>AI Resume Analyzer</h1>
      
      {/* 1. The file picker input */}
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      
      {/* 2. The submit button */}
      <button onClick={handleUpload} style={{ marginLeft: '10px', padding: '5px 10px' }}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

      <hr style={{ margin: '30px 0' }} />

      {/* 3. The display dashboard showing our results */}
      <h3>Extracted Text Result:</h3>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
        {result ? result : "Your extracted resume content will show up here."}
      </div>
    </div>
  );
}
