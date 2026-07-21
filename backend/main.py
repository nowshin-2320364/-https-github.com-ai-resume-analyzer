from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

# 1. Initialize your FastAPI app
app = FastAPI()

# 2. Add CORS Middleware (This unlocks the backend for your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin/port (including Codespaces)
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

# 3. Create the URL route where the frontend will send the file
@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Open the uploaded PDF file safely
    with pdfplumber.open(file.file) as pdf:
        text = ""
        # Loop through every page in the PDF and extract the words
        for page in pdf.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text + "\n"
    
    # Send the raw text back to whoever requested it
    return {"filename": file.filename, "extracted_text": text}
