import asyncio
import os
import uuid
import yt_dlp
from typing import Dict, Any, Optional
from app.config import DOWNLOADS_DIR

async def extract_media_info(url: str) -> Dict[str, Any]:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise ValueError("URL không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
    }

    loop = asyncio.get_event_loop()
    def _extract():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                return info
            except Exception as e:
                raise ValueError(f"Không thể lấy thông tin video: {str(e)}")

    info = await loop.run_in_executor(None, _extract)
    if not info:
        raise ValueError("Không tìm thấy dữ liệu video từ URL này.")

    return {
        "title": info.get("title", "Video không tiêu đề"),
        "thumbnail": info.get("thumbnail", ""),
        "duration": info.get("duration", 0),
        "uploader": info.get("uploader", "Không rõ tác giả"),
        "platform": info.get("extractor_key", "Web"),
        "description": (info.get("description") or "")[:200],
        "url": url
    }

async def download_media(url: str, format_type: str = "video", quality: str = "best") -> Dict[str, Any]:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise ValueError("URL không hợp lệ.")

    file_id = uuid.uuid4().hex[:8]
    out_template = str(DOWNLOADS_DIR / f"{file_id}_%(title).50s.%(ext)s")

    if format_type == "audio":
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "quiet": True,
            "no_warnings": True,
        }
    else:
        # Best video without watermark (yt-dlp selects unwatermarked formats for TikTok automatically)
        ydl_opts = {
            "format": "bestvideo+bestaudio/best",
            "outtmpl": out_template,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
        }

    loop = asyncio.get_event_loop()
    def _download():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                if format_type == "audio":
                    filename = os.path.splitext(filename)[0] + ".mp3"
                elif not filename.endswith(".mp4"):
                    # Check if merged mp4 exists
                    base = os.path.splitext(filename)[0]
                    if os.path.exists(base + ".mp4"):
                        filename = base + ".mp4"
                return info, os.path.basename(filename)
            except Exception as e:
                raise ValueError(f"Lỗi khi tải video: {str(e)}")

    info, basename = await loop.run_in_executor(None, _download)
    full_path = DOWNLOADS_DIR / basename
    file_size = full_path.stat().st_size if full_path.exists() else 0

    return {
        "status": "ready",
        "title": info.get("title", basename),
        "filename": basename,
        "download_url": f"/static/downloads/{basename}",
        "file_size": file_size,
        "format": format_type,
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", "")
    }
