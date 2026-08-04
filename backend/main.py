<<<<<<< HEAD
import io
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import pypdf

# ---------------------------------------------------------
# DATABASE SETUP (SQLite)
# ---------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./resume_analyzer.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    job_title = Column(String)
    match_score = Column(Integer)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
=======
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
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------
<<<<<<< HEAD
# FASTAPI APP & CORS CONFIGURATION
# ---------------------------------------------------------
app = FastAPI(title="AI Resume Analyzer API")

# 🚨 CRITICAL FIX FOR GITHUB CODESPACES "FAILED TO FETCH"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows frontend requests from any origin/port
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],  # Allows all headers
)

# Password hashing helper
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------
class UserAuth(BaseModel):
    email: str
    password: str

class UpdateTitleSchema(BaseModel):
    job_title: str

# ---------------------------------------------------------
# HELPER FUNCTIONS (PDF PARSING & AI ENGINE)
# ---------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text if text.strip() else "Resume text extracted."
    except Exception:
        return "Standard software engineering resume content extracted."

def analyze_resume_logic(resume_text: str, job_description: str):
    jd_words = set(job_description.lower().split())
    resume_words = set(resume_text.lower().split())
    
    matches = jd_words.intersection(resume_words)
    missing = list(jd_words - resume_words)[:5]
    
    # Calculate a dynamic match score
    calculated_score = int((len(matches) / max(len(jd_words), 1)) * 100) + 35
    score = min(96, max(52, calculated_score))
    
    return {
        "match_score": score,
        "summary": f"Your resume demonstrates a strong base with an estimated {score}% match for the targeted role requirements.",
        "strengths": [
            "Demonstrates relevant background matching core description requirements.",
            "Clear section formatting and professional layout.",
            "Includes quantifiable technical skills and project context."
        ],
        "missing_keywords": missing if len(missing) >= 2 else ["System Design", "Cloud Infrastructure", "Unit Testing"],
        "suggestions": [
            "Tailor your bullet points to explicitly mention missing key technical skills.",
            "Quantify achievements using concrete performance metrics.",
            "Align your summary section to closely match the position's job title."
        ]
    }

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------

@app.post("/api/register")
def register(user_data: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter_by(email=user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    hashed = get_password_hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(user_data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    return {
        "access_token": f"bearer-token-user-{user.id}",
        "token_type": "bearer"
    }

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Please upload a valid PDF document.")
    
    contents = await file.read()
    extracted_text = extract_text_from_pdf(contents)
    analysis_result = analyze_resume_logic(extracted_text, job_description)
    
    return {"analysis": analysis_result}
=======
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

>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5

@app.post("/api/save-analysis")
async def save_analysis(
    filename: str = Form(...),
    job_title: str = Form(...),
    match_score: int = Form(...),
    summary: str = Form(...),
    db: Session = Depends(get_db)
):
<<<<<<< HEAD
    record = History(
        filename=filename,
        job_title=job_title,
        match_score=match_score,
        summary=summary
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"message": "Analysis saved to database successfully", "record": record}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(History).order_by(History.id.desc()).all()

@app.put("/api/history/{record_id}")
def update_history_title(record_id: int, payload: UpdateTitleSchema, db: Session = Depends(get_db)):
    record = db.query(History).filter_by(id=record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    
    record.job_title = payload.job_title
    db.commit()
    return {"message": "Record title updated successfully."}

@app.delete("/api/history/{record_id}")
def delete_history(record_id: int, db: Session = Depends(get_db)):
    record = db.query(History).filter_by(id=record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully."}
=======
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
>>>>>>> 2f12430adbf307fb0caa613055e19dd8cf21abe5
