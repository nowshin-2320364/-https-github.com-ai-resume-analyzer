from sqlalchemy import Column, Integer, String, Text, DateTime
import datetime
from database import Base

class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    job_title = Column(String, default="General Resume Scan")
    match_score = Column(Integer)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    