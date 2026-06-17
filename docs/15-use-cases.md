# Use Case Specifications

**Use Case: Analyze Resume Fit**
- **Primary Actor:** Job Seeker
- **Preconditions:** The user has a valid PDF resume under 5MB.
- **Basic Flow:**
  1. Actor uploads PDF and pastes Job Description.
  2. System extracts text.
  3. System queries DeepSeek API.
  4. System renders JSON analytics to Actor.
- **Alternate Flow (Parsing Failure):**
  1. System cannot extract text (e.g., image-only PDF).
  2. System aborts AI query.
  3. System returns 400 error: "Unable to read text from document. Please ensure it is not a scanned image."