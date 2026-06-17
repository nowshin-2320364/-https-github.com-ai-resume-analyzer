# API Specification Design

This document outlines the internal REST API connecting the React frontend to the FastAPI backend. It follows OpenAPI (Swagger) design principles.

## 1. Analyze Resume Endpoint

### `POST /api/analyze`
**Description:** Ingests a raw PDF and a job description string, extracts the text, orchestrates the DeepSeek API prompt, and returns a structured JSON analysis.

#### **Request Parameters**
*   **Method:** `POST`
*   **Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `File (Binary)` | **Yes** | The user's resume. Must be `application/pdf`. Max size: 5MB. |
| `job_description` | `String` | **Yes** | The target job description text. Max length: 10,000 characters. |

#### **Success Response**
*   **Code:** `200 OK`
*   **Content-Type:** `application/json`

```json
{
  "status": "success",
  "data": {
    "match_percentage": 85,
    "summary": "Candidate shows strong backend fundamentals but lacks containerization exposure.",
    "matched_skills": ["Python", "React", "REST APIs", "Git"],
    "missing_skills": ["Docker", "Kubernetes", "CI/CD"],
    "bullet_points_critique": [
      {
        "original": "Made the API faster.",
        "improved": "Optimized API response times by 30% through implementing database indexing.",
        "reason": "Quantifies the achievement and specifies the technical method used."
      }
    ]
  }
}