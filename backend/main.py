import os
import json
from datetime import datetime
from typing import List, Optional
import PyPDF2
from groq import Groq
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import your database setup (assuming standard SQLAlchemy structure)
from database import engine, get_db
import models

# ---------------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# ---------------------------------------------------------
load_dotenv() 

# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ---------------------------------------------------------
# CORS MIDDLEWARE FIX
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (including Codespaces)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# ---------------------------------------------------------
# AI & UTILS SETUP
# ---------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY was not found in the .env file!")

client = Groq(api_key=GROQ_API_KEY)

def extract_text_from_pdf(file_file) -> str:
    try:
        reader = PyPDF2.PdfReader(file_file)
        text = ""
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Failed to read PDF: {str(e)}")

# ---------------------------------------------------------
# PYDANTIC SCHEMAS (For Input/Output Validation)
# ---------------------------------------------------------
class HistoryUpdate(BaseModel):
    job_title: str

# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------

@app.post("/api/upload-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Receives the PDF and Job Description, extracts text, 
    and sends to Groq AI for analysis.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Extract text from the uploaded PDF
        resume_text = extract_text_from_pdf(file.file)
        
        # Prepare the prompt for Groq
        prompt = f"""
        Act as an expert ATS (Applicant Tracking System) and technical recruiter. 
        Analyze the following resume against the provided job description.
        
        Provide the output EXCLUSIVELY in valid JSON format with the following keys:
        - "match_score": an integer from 0 to 100.
        - "summary": a short paragraph summarizing the fit.
        - "strengths": a list of 3-5 key matching skills/experiences.
        - "missing_keywords": a list of 3-5 important missing skills.
        - "suggestions": a list of 3 actionable tips to improve the resume.

        Job Description:
        {job_description}

        Resume Text:
        {resume_text}
        """

        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that outputs strictly valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant", # Updated supported model
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        analysis_result = json.loads(chat_completion.choices[0].message.content)

        return {
            "extracted_text": resume_text[:500] + "...", # Preview of extracted text
            "analysis": analysis_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save-analysis")
async def save_analysis(
    filename: str = Form(...),
    job_title: str = Form(...),
    match_score: int = Form(...),
    summary: str = Form(...),
    db: Session = Depends(get_db)
):
    """Saves a successfully analyzed resume to the SQLite database."""
    try:
        # Updated to use SavedAnalysis instead of HistoryRecord
        new_record = models.SavedAnalysis(
            filename=filename,
            job_title=job_title,
            match_score=match_score,
            summary=summary,
            created_at=datetime.utcnow()
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return {"status": "success", "id": new_record.id}
    except Exception as e:
        db.rollback()
        # Prints exact database error to the backend terminal
        print(f"🚨 DATABASE ERROR: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/history")
async def get_history(db: Session = Depends(get_db)):
    """Fetches all saved reports from the database, newest first."""
    # Updated to use SavedAnalysis
    records = db.query(models.SavedAnalysis).order_by(models.SavedAnalysis.created_at.desc()).all()
    return records


@app.put("/api/history/{record_id}")
async def update_history_title(record_id: int, data: HistoryUpdate, db: Session = Depends(get_db)):
    """Updates the job title of a specific saved report."""
    # Updated to use SavedAnalysis
    record = db.query(models.SavedAnalysis).filter(models.SavedAnalysis.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record.job_title = data.job_title
    db.commit()
    db.refresh(record)
    return {"status": "success", "record": record}


@app.delete("/api/history/{record_id}")
async def delete_history(record_id: int, db: Session = Depends(get_db)):
    """Deletes a saved report from the database."""
    # Updated to use SavedAnalysis
    record = db.query(models.SavedAnalysis).filter(models.SavedAnalysis.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(record)
    db.commit()
    return {"status": "deleted"}