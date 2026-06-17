# Functional Requirements

**FR1: File Ingestion**
The backend API (`/api/analyze`) shall accept multipart/form-data containing a PDF file and a text string.

**FR2: Text Extraction**
The system shall utilize a Python parsing library (`pdfplumber` or `PyMuPDF`) to convert binary PDF data into raw string data.

**FR3: AI Orchestration**
The system shall format the extracted text and target job description into a prompt matrix and dispatch it to the DeepSeek API endpoint.

**FR4: Structured Output Constraint**
The backend shall enforce a rigid JSON schema response from the DeepSeek API to guarantee frontend structural integrity.