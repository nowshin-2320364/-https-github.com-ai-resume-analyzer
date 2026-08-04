from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

# ---------------------------------------------------------
# RESUME HISTORY MODEL
# ---------------------------------------------------------
class HistoryRecord(Base):
    __tablename__ = "history_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    job_title = Column(String, index=True)
    match_score = Column(Integer)
    summary = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# ---------------------------------------------------------
# USER AUTHENTICATION MODEL
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)