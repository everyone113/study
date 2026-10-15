from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.media_downloader import extract_media_info, download_media
from app.config import DOWNLOADS_DIR, PROCESSED_DIR

router = APIRouter(prefix="/api/media", tags=["Media"])

class MediaInfoRequest(BaseModel):
    url: str = Field(..., examples=["https://www.tiktok.com/@user/video/123456789"])

class MediaDownloadRequest(BaseModel):
    url: str
    format_type: Optional[str] = "video"
    quality: Optional[str] = "best"

@router.post("/info")
async def get_media_info(req: MediaInfoRequest):
    try:
        info = await extract_media_info(req.url)
        return info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể xử lý yêu cầu: {str(e)}")

@router.post("/download")
async def download_media_endpoint(req: MediaDownloadRequest):
    try:
        res = await download_media(req.url, req.format_type or "video", req.quality or "best")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tải video: {str(e)}")

@router.get("/downloads")
async def list_downloaded_media():
    files = []
    if DOWNLOADS_DIR.exists():
        for f in DOWNLOADS_DIR.glob("*"):
            if f.is_file() and not f.name.startswith("."):
                files.append({
                    "filename": f.name,
                    "url": f"/static/downloads/{f.name}",
                    "size": f.stat().st_size,
                    "created_at": f.stat().st_mtime
                })
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return files
