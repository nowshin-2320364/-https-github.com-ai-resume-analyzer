# Technical Design Parameters

**Frontend Stack:**
- Vite (React + JavaScript/JSX)
- Tailwind CSS (Styling)

**Backend Stack:**
- Python 3.11+
- FastAPI (Web framework)
- Uvicorn (ASGI server)
- `pdfplumber` (Document parsing)
- `openai` library (Standardized SDK configured to route to `api.deepseek.com`)

**Environment Configurations:**
- `DEEPSEEK_API_KEY` secured in backend `.env`.
- Frontend localized to `http://localhost:5173`.
- Backend localized to `http://localhost:8000`.