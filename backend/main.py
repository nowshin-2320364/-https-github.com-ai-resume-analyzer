from fastapi import FastAPI, UploadFile, File
import pdfplumber

# 1. Initialize your FastAPI app (the server framework)
app = FastAPI()

# 2. Create the URL route where the frontend will send the file
@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Open the uploaded PDF file safely
    with pdfplumber.open(file.file) as pdf:
        text = ""
        # Loop through every page in the PDF and extract the words
        for page in pdf.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text + "\n"
    
    # Send the raw text back to whoever requested it
    return {"filename": file.filename, "extracted_text": text}
    