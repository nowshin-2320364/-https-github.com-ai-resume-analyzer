# System Architecture Design

The application utilizes a **Client-Server Architecture** with a stateless backend proxy for AI communication.

1. **Presentation Layer:** React.js single-page application handling browser DOM state and API fetch requests.
2. **Application Layer:** FastAPI Python server running on Uvicorn. Implements CORS middleware and route controllers.
3. **Service Integration Layer:** DeepSeek Python SDK integration, utilizing system prompts and Pydantic base models to force rigid API outputs.