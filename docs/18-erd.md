# Entity-Relationship Diagram (Conceptual)

*(Note: The MVP is primarily stateless, processing data in-memory. However, if a persistence layer is added for history tracking, the ERD is structured as follows):*

**Entity: AnalysisRecord**
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `job_description_snippet` (String, max 200 chars)
- `match_score` (Integer, 0-100)
- `missing_skills` (Array of Strings)
- `rewrites` (JSON/Array of Objects)