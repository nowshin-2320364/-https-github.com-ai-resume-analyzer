# User Journey Map

**Phase 1: Discovery & Input**
- User navigates to the web app interface.
- User uploads their `resume.pdf` file.
- User pastes the target job description into the text area.
- User clicks "Analyze".

**Phase 2: Processing (System)**
- UI enters a dynamic loading state (progress indicators).
- Backend strips PDF formatting and securely communicates with the DeepSeek API.

**Phase 3: Actionable Review**
- User views the high-level match score.
- User reviews the flagged "Missing Skills" list.
- User reads the AI's suggested rewrites for weak bullet points and updates their local Word/Google Doc resume.