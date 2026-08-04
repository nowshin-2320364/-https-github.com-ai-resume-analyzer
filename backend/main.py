import os
import io
import json
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pypdf import PdfReader
from groq import Groq
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
import pyotp

import models
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT & Password Hashing Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Pydantic Schemas
class UserAuthSchema(BaseModel):
    email: str
    password: str

class UpdateTitleSchema(BaseModel):
    job_title: str

class TwoFactorVerifySchema(BaseModel):
    email: str
    code: str

class TwoFactorEnableSchema(BaseModel):
    code: str

# Auth Helpers
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication Endpoints
@app.post("/api/register")
def register(user_data: UserAuthSchema, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(user_data: UserAuthSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if 2FA is enabled for user
    if user.is_two_factor_enabled:
        return {
            "requires_2fa": True,
            "email": user.email
        }

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_two_factor_enabled": False
    }

# 2FA Endpoints
@app.post("/api/2fa/verify")
def verify_2fa_login(payload: TwoFactorVerifySchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.is_two_factor_enabled or not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")
    
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(payload.code.strip()):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/2fa/setup")
def setup_2fa(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.two_factor_secret:
        current_user.two_factor_secret = pyotp.random_base32()
        db.commit()
        db.refresh(current_user)
    
    totp = pyotp.TOTP(current_user.two_factor_secret)
    otpauth_url = totp.provisioning_uri(name=current_user.email, issuer_name="AI Resume Analyzer")
    
    return {
        "secret": current_user.two_factor_secret,
        "otpauth_url": otpauth_url
    }

@app.post("/api/2fa/enable")
def enable_2fa(
    payload: TwoFactorEnableSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(payload.code.strip()):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    current_user.is_two_factor_enabled = True
    db.commit()
    return {"message": "2FA successfully enabled"}

# Resume Analysis Endpoint
@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...), 
    job_description: Optional[str] = Form("")
):
    if not client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing on server.")

    try:
        contents = await file.read()
        pdf_reader = PdfReader(io.BytesIO(contents))
        resume_text = "".join([page.extract_text() or "" for page in pdf_reader.pages])

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

        if job_description and job_description.strip():
            prompt = f"""
You are an expert ATS (Applicant Tracking System) optimizer. 
Analyze the following resume against the given job description.

Job Description:
{job_description}

Resume Content:
{resume_text}

Return ONLY a JSON object formatted strictly as follows:
{{
"match_score": <number between 0 and 100>,
"summary": "<2-3 sentence overview of candidate match>",
"strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
"missing_keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
"suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}
"""
        else:
            prompt = f"""
You are an expert ATS (Applicant Tracking System) optimizer. 
Perform a comprehensive general ATS evaluation on the following resume text.
Since no job description was provided, evaluate overall resume quality, readability, ATS structure, and overall impact.

Resume Content:
{resume_text}

Return ONLY a JSON object formatted strictly as follows:
{{
"match_score": <number between 0 and 100 representing general quality>,
"summary": "<2-3 sentence general overview of the resume>",
"strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
"missing_keywords": ["<missing general power word or skill 1>", "<missing general power word or skill 2>"],
"suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        analysis_result = json.loads(completion.choices[0].message.content)
        return {"analysis": analysis_result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Saved Analysis CRUD Endpoints (Protected by Login)
@app.post("/api/save-analysis")
def save_analysis(
    filename: str = Form(...),
    job_title: str = Form(...),
    match_score: float = Form(...),
    summary: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    saved_item = models.SavedAnalysis(
        user_id=current_user.id,
        filename=filename,
        job_title=job_title,
        match_score=match_score,
        summary=summary
    )
    db.add(saved_item)
    db.commit()
    db.refresh(saved_item)
    return {"message": "Saved successfully", "id": saved_item.id}

@app.get("/api/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.SavedAnalysis).filter(
        models.SavedAnalysis.user_id == current_user.id
    ).order_by(models.SavedAnalysis.created_at.desc()).all()

@app.put("/api/history/{record_id}")
def update_history_title(
    record_id: int,
    payload: UpdateTitleSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.SavedAnalysis).filter(
        models.SavedAnalysis.id == record_id,
        models.SavedAnalysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.job_title = payload.job_title
    db.commit()
    return {"message": "Updated successfully"}

@app.delete("/api/history/{record_id}")
def delete_history(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.SavedAnalysis).filter(
        models.SavedAnalysis.id == record_id,
        models.SavedAnalysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}
