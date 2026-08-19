# CatalogGuard Backend

FastAPI backend service for the CatalogGuard platform.

## Requirements

- Python 3.10+

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

2. Activate the virtual environment:
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```cmd
     .venv\Scripts\activate
     ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the FastAPI development server from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

## Health Check

Verify the service is running:

- Endpoint: `GET /health`
- Response:
  ```json
  {
    "status": "ok"
  }
  ```

FastAPI automatic interactive documentation (Swagger UI) is available at `/docs`.
