# Data Flow Diagram (DFD)

## Level 0 (Context Diagram)
`[Job Seeker]` ---> (PDF + JD String) ---> `[Resume Analyzer System]` ---> (Analysis Dashboard UI) ---> `[Job Seeker]`

## Level 1 
1. `[Client UI]` sends `FormData(file, string)` to `[FastAPI Server]`.
2. `[FastAPI Server]` streams `file` into `[PDF Extractor Node]`.
3. `[PDF Extractor Node]` outputs `Resume_String`.
4. `[FastAPI Server]` bundles `Resume_String` + `JD String` + `JSON Schema` and requests `[DeepSeek API]`.
5. `[DeepSeek API]` computes logic and returns `Structured JSON Payload`.
6. `[FastAPI Server]` forwards `Structured JSON Payload` back to `[Client UI]`.