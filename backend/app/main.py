from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import DOWNLOADS_DIR, PROCESSED_DIR, DOCUMENTS_DIR
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="StudyMediaHub API",
    description="All-in-one Personal Workstation for Students & Creators",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.academic import router as academic_router
from app.routes.notes import router as notes_router
from app.routes.documents import router as documents_router
from app.routes.code_runner import router as code_runner_router
from app.routes.media import router as media_router
from app.routes.smart_tools import router as smart_tools_router

app.include_router(academic_router)
app.include_router(notes_router)
app.include_router(documents_router)
app.include_router(code_runner_router)
app.include_router(media_router)
app.include_router(smart_tools_router)

# Serve downloads, processed media, and documents
app.mount("/static/downloads", StaticFiles(directory=DOWNLOADS_DIR), name="downloads")
app.mount("/static/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")
app.mount("/static/documents", StaticFiles(directory=DOCUMENTS_DIR), name="documents")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": "StudyMediaHub",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
