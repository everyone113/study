import os
import re
import urllib.parse
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import Optional
import aiosqlite
import httpx

from app.config import DOCUMENTS_DIR
from app.database import get_db
from app.models.notes import DocumentDownloadRequest

router = APIRouter(prefix="/api/documents", tags=["Documents"])

def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", filename)
    return cleaned.strip() or "document.bin"

@router.get("")
async def get_documents(
    subject_id: Optional[int] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
        SELECT d.*, s.name as subject_name, s.code as subject_code
        FROM documents d
        LEFT JOIN subjects s ON d.subject_id = s.id
        WHERE 1=1
    """
    params = []
    if subject_id is not None:
        query += " AND d.subject_id = ?"
        params.append(subject_id)
    query += " ORDER BY d.id DESC"
    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("/download-url")
async def download_document_from_url(
    req: DocumentDownloadRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    url = req.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="URL phải bắt đầu bằng http:// hoặc https://")

    # Determine filename
    parsed = urllib.parse.urlparse(url)
    raw_filename = os.path.basename(parsed.path) or "downloaded_file"
    if not os.path.splitext(raw_filename)[1]:
        raw_filename += ".pdf" # Default to pdf if no extension

    filename = sanitize_filename(raw_filename)
    dest_path = DOCUMENTS_DIR / filename

    # Avoid overwriting existing filename
    base_name, ext = os.path.splitext(filename)
    counter = 1
    while dest_path.exists():
        filename = f"{base_name}_{counter}{ext}"
        dest_path = DOCUMENTS_DIR / filename
        counter += 1

    file_size = 0
    file_type = ext.replace(".", "")

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            async with client.stream("GET", url) as response:
                if response.status_code >= 400:
                    raise HTTPException(status_code=400, detail=f"Không thể tải từ URL (Mã lỗi {response.status_code})")

                with open(dest_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
                        file_size += len(chunk)

    except Exception as e:
        if dest_path.exists():
            dest_path.unlink(missing_ok=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Lỗi khi tải file: {str(e)}")

    # Insert into database
    cursor = await db.execute("""
        INSERT INTO documents (subject_id, title, filename, file_path, source_url, file_size, file_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (req.subject_id, req.title or filename, filename, f"/static/documents/{filename}", url, file_size, file_type))
    await db.commit()
    doc_id = cursor.lastrowid

    cursor = await db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = await cursor.fetchone()
    return dict(doc)

@router.post("/upload")
async def upload_document(
    title: str = Form(...),
    subject_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db)
):
    filename = sanitize_filename(file.filename or "uploaded_file")
    dest_path = DOCUMENTS_DIR / filename
    base_name, ext = os.path.splitext(filename)
    counter = 1
    while dest_path.exists():
        filename = f"{base_name}_{counter}{ext}"
        dest_path = DOCUMENTS_DIR / filename
        counter += 1

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    file_size = len(content)
    file_type = ext.replace(".", "")

    cursor = await db.execute("""
        INSERT INTO documents (subject_id, title, filename, file_path, source_url, file_size, file_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (subject_id, title, filename, f"/static/documents/{filename}", "local_upload", file_size, file_type))
    await db.commit()
    doc_id = cursor.lastrowid

    cursor = await db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = await cursor.fetchone()
    return dict(doc)

@router.delete("/{id}")
async def delete_document(id: int, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT filename FROM documents WHERE id = ?", (id,))
    doc = await cursor.fetchone()
    if doc:
        file_path = DOCUMENTS_DIR / doc["filename"]
        file_path.unlink(missing_ok=True)
        await db.execute("DELETE FROM documents WHERE id = ?", (id,))
        await db.commit()
    return {"status": "ok", "message": "Document deleted"}
