import os
import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()

app = FastAPI()

# Enable CORS for cross-origin requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "Backend API powered by Groq (Llama 3.3 70B) is Running!"}

@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):
    # 1. Extract text from uploaded PDF
    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        return {"error": f"Failed to read PDF file: {str(e)}"}

    # 2. Retrieve Groq API Key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "extracted_text": text,
            "analysis": {
                "match_score": 0,
                "summary": "Missing GROQ_API_KEY in backend/.env file.",
                "strengths": [],
                "missing_keywords": [],
                "suggestions": ["Add GROQ_API_KEY=gsk_... to backend/.env and restart."]
            }
        }

    # 3. Call Groq API (Llama 3.3 70B Versatile)
    try:
        client = Groq(api_key=api_key)

        prompt = f"""
        You are an expert HR Specialist and ATS resume analyzer.
        Analyze the candidate resume against the provided job description.

        RESUME TEXT:
        {text}

        JOB DESCRIPTION:
        {job_description if job_description else "General Technical Assessment"}

        Return ONLY a JSON object matching these exact keys:
        - match_score: integer from 0 to 100
        - summary: brief fit assessment string
        - strengths: array of strings
        - missing_keywords: array of strings
        - suggestions: array of actionable recommendations
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a specialized ATS analyzer. You MUST respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.2
        )

        analysis_data = json.loads(chat_completion.choices[0].message.content)

    except Exception as e:
        print("Groq API Error:", str(e))
        analysis_data = {
            "match_score": 0,
            "summary": f"Failed to call Groq API: {str(e)}",
            "strengths": [],
            "missing_keywords": [],
            "suggestions": ["Check backend terminal logs for traceback."]
        }

    return {
        "filename": file.filename,
        "extracted_text": text,
        "analysis": analysis_data
    }