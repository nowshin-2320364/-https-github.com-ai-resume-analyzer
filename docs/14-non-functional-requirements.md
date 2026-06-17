# Non-Functional Requirements

**NFR1: Performance & Latency**
The application must handle the standard API round-trip and text extraction in under 6 seconds to prevent user drop-off.

**NFR2: Security & Privacy**
Resumes contain Personally Identifiable Information (PII). Uploaded files must be processed in-memory on the backend and immediately discarded. No resumes will be written to disk.

**NFR3: Usability**
The frontend must be fully responsive, utilizing modern CSS frameworks (Tailwind) to ensure readability on both desktop and mobile web browsers.