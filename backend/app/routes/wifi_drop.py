import os
import re
import socket
import time
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import DROP_DIR, FRONTEND_PORT, PORT

router = APIRouter(prefix="/api/drop", tags=["WiFi Drop"])

def get_local_ip() -> str:
    """Detect the active primary LAN IP address on Wi-Fi/Ethernet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Does not actually establish internet connection or send packets
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_file_type(extension: str) -> str:
    ext = extension.lower().lstrip(".")
    if ext in ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif"]:
        return "image"
    elif ext in ["mp4", "mov", "avi", "mkv", "webm", "m4v"]:
        return "video"
    elif ext in ["mp3", "wav", "m4a", "flac", "aac", "ogg"]:
        return "audio"
    elif ext in ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "zip", "rar"]:
        return "document"
    return "other"

@router.get("/network-info")
async def get_network_info():
    """Returns local LAN IP, port, and direct mobile upload URL for QR code."""
    ip = get_local_ip()
    return {
        "local_ip": ip,
        "frontend_port": FRONTEND_PORT,
        "backend_port": PORT,
        "upload_url": f"http://{ip}:{FRONTEND_PORT}/?mode=drop"
    }

@router.get("/files")
async def list_dropped_files():
    """List all files transferred via WiFi Drop, newest first."""
    files = []
    if not DROP_DIR.exists():
        return []

    for entry in DROP_DIR.iterdir():
        if entry.is_file():
            stat = entry.stat()
            ext = entry.suffix.lower()
            # Parse original name from timestamp_prefix_name
            name_parts = entry.name.split("_", 2)
            display_name = name_parts[-1] if len(name_parts) >= 3 else entry.name

            files.append({
                "id": entry.name,
                "filename": entry.name,
                "display_name": display_name,
                "size": stat.st_size,
                "size_formatted": format_size(stat.st_size),
                "modified_at": stat.st_mtime,
                "url": f"/static/wifidrop/{entry.name}",
                "file_type": get_file_type(ext),
                "extension": ext.lstrip(".")
            })

    # Sort descending by modified time
    files.sort(key=lambda x: x["modified_at"], reverse=True)
    return files

@router.post("/upload")
async def upload_dropped_files(files: List[UploadFile] = File(...)):
    """Upload one or multiple photos/files from phone or PC over WiFi."""
    if not files:
        raise HTTPException(status_code=400, detail="Không có tệp nào được chọn")

    saved_files = []
    timestamp = int(time.time() * 1000)

    for idx, file in enumerate(files):
        # Sanitize filename
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename or f"photo_{idx}.jpg")
        stored_filename = f"drop_{timestamp}_{idx}_{clean_name}"
        dest_path = DROP_DIR / stored_filename

        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)

        ext = dest_path.suffix.lower()
        saved_files.append({
            "id": stored_filename,
            "filename": stored_filename,
            "display_name": file.filename or clean_name,
            "size": len(content),
            "size_formatted": format_size(len(content)),
            "url": f"/static/wifidrop/{stored_filename}",
            "file_type": get_file_type(ext),
            "extension": ext.lstrip(".")
        })

    return {
        "status": "success",
        "message": f"Đã chuyển thành công {len(saved_files)} tệp qua Wi-Fi",
        "files": saved_files
    }

@router.delete("/files/{filename}")
async def delete_dropped_file(filename: str):
    """Delete a single dropped file safely."""
    # Prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Tên tệp không hợp lệ")

    target = DROP_DIR / filename
    if target.exists() and target.is_file():
        target.unlink()
        return {"status": "success", "message": f"Đã xóa tệp {filename}"}
    raise HTTPException(status_code=404, detail="Không tìm thấy tệp")

@router.delete("/clear")
async def clear_all_dropped_files():
    """Clear all transferred files in WiFi Drop folder."""
    count = 0
    if DROP_DIR.exists():
        for item in DROP_DIR.iterdir():
            if item.is_file():
                try:
                    item.unlink()
                    count += 1
                except Exception:
                    pass
    return {"status": "success", "message": f"Đã dọn dẹp {count} tệp"}
