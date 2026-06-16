# Product Requirement Document (PRD)

## Product Vision
To democratize enterprise-grade resume screening by providing instant, AI-driven, transparent feedback to every job seeker.

## MVP Scope (Core Release)
- Secure PDF upload and raw text extraction via backend.
- Job description text input.
- DeepSeek API integration utilizing structured JSON outputs.
- React dashboard displaying Match Score (0-100%), Missing Skills, and Bullet Point Rewrites.

## Success Metrics
1. **Performance:** End-to-end analysis (upload to JSON render) completed in under 6 seconds.
2. **Accuracy:** DeepSeek API returns valid JSON adhering to the Pydantic schema 99% of the time without crashing the UI.