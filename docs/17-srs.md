# System Requirements Specification Summary

This document binds the functional, non-functional, and data flow constraints of the AI Resume Analyzer. 

**System Boundaries:** The system relies on external connectivity to the DeepSeek API. If the API is down or rate-limited, the core analysis functionality becomes temporarily unavailable. 

**Assumptions:**
- Users possess documents containing extractable digital text, not flattened image scans.
- The DeepSeek API structure remains compliant with standard OpenAI SDK JSON schema requirements.