from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import DOWNLOADS_DIR, PROCESSED_DIR, DOCUMENTS_DIR, DROP_DIR
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
from app.routes.subtitles import router as subtitles_router
from app.routes.wifi_drop import router as wifi_drop_router
from app.routes.auth import router as auth_router
from app.routes.sync import router as sync_router
from app.routes.mindmap import router as mindmap_router
from app.routes.forensics import router as forensics_router

app.include_router(academic_router)
app.include_router(notes_router)
app.include_router(documents_router)
app.include_router(code_runner_router)
app.include_router(media_router)
app.include_router(smart_tools_router)
app.include_router(subtitles_router)
app.include_router(wifi_drop_router)
app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(mindmap_router)
app.include_router(forensics_router)

# Serve downloads, processed media, documents, and wifi drop
app.mount("/static/downloads", StaticFiles(directory=DOWNLOADS_DIR), name="downloads")
app.mount("/static/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")
app.mount("/static/documents", StaticFiles(directory=DOCUMENTS_DIR), name="documents")
app.mount("/static/wifidrop", StaticFiles(directory=DROP_DIR), name="wifidrop")

import httpx
from fastapi.responses import HTMLResponse, Response
from fastapi import HTTPException
from app.routes.wifi_drop import get_mobile_drop_html, get_local_ip

@app.get("/api/anatomy-data/{file_path:path}")
@app.get("/anatomy-data/{file_path:path}")
async def proxy_anatomy_data(file_path: str):
    """High-performance CORS-free proxy for 3D Anatomy Atlas data with local file priority."""
    local_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "frontend", "public", "anatomy-data", file_path.replace("/", os.sep)
    )
    if os.path.exists(local_path) and os.path.isfile(local_path):
        import mimetypes
        mime_type, _ = mimetypes.guess_type(local_path)
        with open(local_path, "rb") as f:
            content = f.read()
        return Response(
            content=content,
            status_code=200,
            media_type=mime_type or "application/octet-stream",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        )

    target_url = f"https://svitylo.com/anatomy-data/{file_path}"
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            res = await client.get(target_url)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=f"Data file not found on remote ({res.status_code})")
            return Response(
                content=res.content,
                status_code=200,
                media_type=res.headers.get("content-type", "application/octet-stream"),
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")

@app.get("/drop", response_class=HTMLResponse)
async def drop_page():
    """Ultra-fast 0ms standalone mobile photo drop page."""
    ip = get_local_ip()
    from app.config import PORT, FRONTEND_PORT
    return HTMLResponse(get_mobile_drop_html(ip, PORT, FRONTEND_PORT))

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
