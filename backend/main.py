import os
import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()

app = FastAPI()

# Enable CORS for cross-origin requests from frontend (Port 5173 -> Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "Backend API with Gemini 3.5 Flash is Running!"}

@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):
    # 1. Extract text from uploaded PDF resume
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text + "\n"

    # 2. Check API key presence
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "filename": file.filename,
            "extracted_text": text,
            "analysis": {
                "match_score": 0,
                "summary": "Missing GEMINI_API_KEY in backend/.env file.",
                "strengths": [],
                "weaknesses": [],
                "missing_keywords": [],
                "suggestions": ["Add GEMINI_API_KEY=your_key to backend/.env and restart uvicorn."]
            }
        }

    # 3. Request structured ATS evaluation using Gemini 3.5 Flash
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are an expert HR Specialist and ATS resume analyzer.
        Analyze the candidate resume against the provided job description.

        RESUME TEXT:
        {text}

        JOB DESCRIPTION:
        {job_description if job_description else "General Technical Assessment"}

        Return a single JSON object matching these exact keys:
        - match_score: integer from 0 to 100
        - summary: brief fit assessment string
        - strengths: array of strings
        - weaknesses: array of strings
        - missing_keywords: array of strings
        - suggestions: array of actionable recommendations
        """

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        analysis_data = json.loads(response.text)

    except Exception as e:
        print("Gemini API Exception:", e)
        analysis_data = {
            "match_score": 0,
            "summary": f"Failed to call Gemini API: {str(e)}",
            "strengths": [],
            "weaknesses": [],
            "missing_keywords": [],
            "suggestions": ["Check backend terminal logs for full traceback."]
        }

    return {
        "filename": file.filename,
        "extracted_text": text,
        "analysis": analysis_data
    }