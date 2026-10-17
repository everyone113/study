import asyncio
import os
import uuid
import re
import urllib.parse
import httpx
import yt_dlp
from typing import Dict, Any, Optional
from app.config import DOWNLOADS_DIR

def is_tiktok_url(url: str) -> bool:
    clean = url.lower()
    return any(k in clean for k in ["tiktok.com", "douyin.com", "v.douyin.com"])

async def extract_tiktok_tikwm(url: str) -> Optional[Dict[str, Any]]:
    try:
        api_url = f"https://www.tikwm.com/api/?url={urllib.parse.quote(url)}"
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(api_url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == 0 and data.get("data"):
                    d = data["data"]
                    return {
                        "title": d.get("title") or "Video TikTok Sạch Logo",
                        "thumbnail": d.get("cover") or "",
                        "duration": d.get("duration", 0),
                        "uploader": d.get("author", {}).get("nickname") or "TikTok Creator",
                        "platform": "TikTok (Sạch Logo)",
                        "description": d.get("title", ""),
                        "url": url,
                        "clean_video_url": d.get("play") or d.get("hdplay"),
                        "hd_video_url": d.get("hdplay") or d.get("play"),
                        "clean_audio_url": d.get("music")
                    }
    except Exception as e:
        print(f"TikWM extract warning: {e}")
    return None

async def extract_media_info(url: str) -> Dict[str, Any]:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise ValueError("URL không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://")

    # 1. Specialized Direct Watermark-Free TikTok Extractor
    if is_tiktok_url(url):
        tiktok_data = await extract_tiktok_tikwm(url)
        if tiktok_data:
            return tiktok_data

    # 2. Universal yt-dlp Extractor for YouTube, Facebook, Twitter, etc.
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

    # Handle TikTok via TikWM fast clean stream
    if is_tiktok_url(url):
        tiktok_data = await extract_tiktok_tikwm(url)
        if tiktok_data:
            target_url = tiktok_data.get("clean_audio_url") if format_type == "audio" else (tiktok_data.get("hd_video_url") or tiktok_data.get("clean_video_url"))
            if target_url:
                ext = "mp3" if format_type == "audio" else "mp4"
                safe_title = re.sub(r'[\\/*?:"<>|]', "", tiktok_data.get("title", "tiktok_video"))[:40].strip() or "tiktok"
                basename = f"{file_id}_{safe_title}.{ext}"
                full_path = DOWNLOADS_DIR / basename
                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    async with client.stream("GET", target_url, headers={"User-Agent": "Mozilla/5.0"}) as resp:
                        if resp.status_code == 200:
                            with open(full_path, "wb") as f:
                                async for chunk in resp.aiter_bytes():
                                    f.write(chunk)
                            file_size = full_path.stat().st_size
                            return {
                                "status": "ready",
                                "title": tiktok_data.get("title", basename),
                                "filename": basename,
                                "download_url": f"/static/downloads/{basename}",
                                "file_size": file_size,
                                "format": format_type,
                                "duration": tiktok_data.get("duration", 0),
                                "thumbnail": tiktok_data.get("thumbnail", "")
                            }

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
