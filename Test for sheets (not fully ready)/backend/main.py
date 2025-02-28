# backend/main.py

from fastapi import FastAPI
from .routes import router as api_router

app = FastAPI()
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
