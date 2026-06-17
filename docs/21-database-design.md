# Database Design (Schema Definition)

*For future extensibility, data is structured for a document-store database (e.g., MongoDB).*

**Collection: `reports`**
```json
{
  "_id": "ObjectId",
  "timestamp": "ISODate",
  "input": {
    "filename": "alex_resume_v2.pdf",
    "target_role": "Backend Developer"
  },
  "metrics": {
    "score": 82,
    "skills_found": ["Python", "Git", "REST"],
    "skills_missing": ["Docker", "Redis"]
  }
}