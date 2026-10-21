import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/api/sync", tags=["sync"])

class PushSyncRequest(BaseModel):
    user_id: str
    academic_subjects: Optional[List[Dict[str, Any]]] = []
    gpa_summary: Optional[Dict[str, Any]] = {}
    notes: Optional[List[Dict[str, Any]]] = []
    documents: Optional[List[Dict[str, Any]]] = []
    flashcards: Optional[List[Dict[str, Any]]] = []

@router.post("/push")
async def push_sync(req: PushSyncRequest, db = Depends(get_db)):
    """Push local changes to cloud database for this specific user_id."""
    if not req.user_id:
        raise HTTPException(status_code=400, detail="Thiếu mã định danh user_id.")

    subjects_json = json.dumps(req.academic_subjects or [], ensure_ascii=False)
    gpa_json = json.dumps(req.gpa_summary or {}, ensure_ascii=False)
    notes_json = json.dumps(req.notes or [], ensure_ascii=False)
    docs_json = json.dumps(req.documents or [], ensure_ascii=False)
    cards_json = json.dumps(req.flashcards or [], ensure_ascii=False)

    await db.execute("""
        INSERT INTO user_sync (user_id, academic_subjects, gpa_summary, notes, documents, flashcards, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            academic_subjects = excluded.academic_subjects,
            gpa_summary = excluded.gpa_summary,
            notes = excluded.notes,
            documents = excluded.documents,
            flashcards = excluded.flashcards,
            updated_at = CURRENT_TIMESTAMP
    """, (req.user_id, subjects_json, gpa_json, notes_json, docs_json, cards_json))

    await db.commit()

    cursor = await db.execute("SELECT updated_at FROM user_sync WHERE user_id = ?", (req.user_id,))
    row = await cursor.fetchone()
    updated_at = row["updated_at"] if row else None

    return {
        "success": True,
        "message": "Đã đồng bộ toàn bộ dữ liệu cá nhân lên đám mây an toàn!",
        "user_id": req.user_id,
        "updated_at": updated_at
    }

@router.get("/check")
async def check_sync(user_id: str, db = Depends(get_db)):
    """Lightweight check to see if cloud data exists and its last updated timestamp."""
    if not user_id:
        raise HTTPException(status_code=400, detail="Thiếu mã định danh user_id.")

    cursor = await db.execute("SELECT updated_at FROM user_sync WHERE user_id = ?", (user_id,))
    row = await cursor.fetchone()
    if not row or not row["updated_at"]:
        return {
            "success": True,
            "exists": False,
            "updated_at": None
        }

    return {
        "success": True,
        "exists": True,
        "updated_at": row["updated_at"]
    }

@router.get("/pull")
async def pull_sync(user_id: str, db = Depends(get_db)):
    """Pull synchronized cloud data for this specific user_id."""
    if not user_id:
        raise HTTPException(status_code=400, detail="Thiếu mã định danh user_id.")

    cursor = await db.execute("SELECT * FROM user_sync WHERE user_id = ?", (user_id,))
    row = await cursor.fetchone()

    if not row:
        return {
            "success": True,
            "has_data": False,
            "data": {
                "academic_subjects": [],
                "gpa_summary": None,
                "notes": [],
                "documents": [],
                "flashcards": []
            }
        }

    row_dict = dict(row)
    try:
        subjects = json.loads(row_dict.get("academic_subjects") or '[]')
    except Exception:
        subjects = []

    try:
        gpa = json.loads(row_dict.get("gpa_summary") or '{}')
    except Exception:
        gpa = None

    try:
        notes = json.loads(row_dict.get("notes") or '[]')
    except Exception:
        notes = []

    try:
        docs = json.loads(row_dict.get("documents") or '[]')
    except Exception:
        docs = []

    try:
        cards = json.loads(row_dict.get("flashcards") or '[]')
    except Exception:
        cards = []

    return {
        "success": True,
        "has_data": True,
        "updated_at": row_dict.get("updated_at"),
        "data": {
            "academic_subjects": subjects,
            "gpa_summary": gpa,
            "notes": notes,
            "documents": docs,
            "flashcards": cards
        }
    }
