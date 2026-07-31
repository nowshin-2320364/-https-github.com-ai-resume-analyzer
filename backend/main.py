import json
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database import Base, engine, get_db
from models import SavedAnalysis
from pydantic import BaseModel

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Pydantic schema for Update operations
class UpdateAnalysisRequest(BaseModel):
    job_title: str

# -------------------------------------------------------------
# 1. CREATE: Save an Analysis to DB
# -------------------------------------------------------------
@app.post("/api/save-analysis")
def save_analysis(
    filename: str = Form(...),
    job_title: str = Form(...),
    match_score: int = Form(...),
    summary: str = Form(...),
    db: Session = Depends(get_db)
):
    new_record = SavedAnalysis(
        filename=filename,
        job_title=job_title,
        match_score=match_score,
        summary=summary
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"message": "Analysis saved successfully!", "data": new_record}

# -------------------------------------------------------------
# 2. READ: Get All Saved Analyses
# -------------------------------------------------------------
@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(SavedAnalysis).order_by(SavedAnalysis.created_at.desc()).all()
    return records

# -------------------------------------------------------------
# 3. UPDATE: Update Job Title / Notes for a Saved Report
# -------------------------------------------------------------
@app.put("/api/history/{analysis_id}")
def update_analysis(analysis_id: int, req: UpdateAnalysisRequest, db: Session = Depends(get_db)):
    record = db.query(SavedAnalysis).filter(SavedAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    record.job_title = req.job_title
    db.commit()
    db.refresh(record)
    return {"message": "Updated successfully!", "data": record}

# -------------------------------------------------------------
# 4. DELETE: Remove an Analysis Report
# -------------------------------------------------------------
@app.delete("/api/history/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    record = db.query(SavedAnalysis).filter(SavedAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    db.delete(record)
    db.commit()
    return {"message": f"Deleted analysis record {analysis_id}"}