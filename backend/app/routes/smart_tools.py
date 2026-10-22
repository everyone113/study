from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from typing import Optional, List
import aiosqlite

from app.database import get_db
from app.services.tts_service import generate_speech, VOICES
from app.services.bg_remover import remove_background
from app.services.watermark_remover import remove_watermark

router = APIRouter(prefix="/api/tools", tags=["Smart Tools"])

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "vi-VN-HoaiMyNeural"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"

class FlashcardCreate(BaseModel):
    deck_name: str = Field(..., examples=["OOP", "Tiếng Anh C1"])
    front: str
    back: str

class SummarizeRequest(BaseModel):
    text: str
    title: Optional[str] = "Tài liệu học tập"

@router.get("/tts/voices")
async def get_voices():
    return VOICES

@router.post("/tts")
async def tts_endpoint(req: TTSRequest):
    try:
        res = await generate_speech(req.text, req.voice or "vi-VN-HoaiMyNeural", req.rate or "+0%", req.pitch or "+0Hz")
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remove-bg")
async def remove_bg_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        res = remove_background(content, file.filename or "image.png")
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tách nền: {str(e)}")

@router.get("/flashcards")
async def get_flashcards(
    deck_name: Optional[str] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = "SELECT * FROM flashcards WHERE 1=1"
    params = []
    if deck_name:
        query += " AND deck_name = ?"
        params.append(deck_name)
    query += " ORDER BY id DESC"
    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("/flashcards")
async def create_flashcard(card: FlashcardCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("""
        INSERT INTO flashcards (deck_name, front, back)
        VALUES (?, ?, ?)
    """, (card.deck_name, card.front, card.back))
    await db.commit()
    card_id = cursor.lastrowid
    cursor = await db.execute("SELECT * FROM flashcards WHERE id = ?", (card_id,))
    row = await cursor.fetchone()
    return dict(row)

@router.delete("/flashcards/{id}")
async def delete_flashcard(id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM flashcards WHERE id = ?", (id,))
    await db.commit()
    return {"status": "ok", "message": "Card deleted"}

@router.post("/summarize")
async def summarize_text(req: SummarizeRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Văn bản không được để trống")

    # Intelligent text summarization and question generator
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 20]
    sentences = [s.strip() for s in text.replace("\n", " ").split(". ") if len(s.strip()) > 15]

    # Extract key bullets
    key_points = sentences[:5] if len(sentences) >= 5 else sentences

    # Generate sample practice questions based on sentences
    questions = []
    for i, p in enumerate(key_points[:3]):
        words = p.split()
        if len(words) > 6:
            questions.append({
                "question": f"Câu hỏi ôn tập {i+1}: Hãy phân tích ý nghĩa của mệnh đề sau trong bài học: '{p}'?",
                "key_idea": p
            })

    return {
        "title": req.title,
        "word_count": len(text.split()),
        "key_takeaways": key_points,
        "generated_quiz": questions,
        "summary": " ".join(key_points)
    }

@router.post("/remove-watermark")
async def remove_watermark_endpoint(
    file: UploadFile = File(...),
    mask: Optional[UploadFile] = File(None),
    corner: Optional[str] = Form(None),
    box_x: Optional[int] = Form(None),
    box_y: Optional[int] = Form(None),
    box_w: Optional[int] = Form(None),
    box_h: Optional[int] = Form(None),
    inpaint_radius: int = Form(4),
    dilate_radius: int = Form(5),
    method: str = Form("telea")
):
    try:
        content = await file.read()
        mask_content = None
        if mask:
            mask_content = await mask.read()
            if len(mask_content) == 0:
                mask_content = None

        box = None
        if box_x is not None and box_y is not None and box_w is not None and box_h is not None:
            box = {"x": box_x, "y": box_y, "w": box_w, "h": box_h}

        res = remove_watermark(
            image_bytes=content,
            original_filename=file.filename or "image.png",
            mask_bytes=mask_content,
            corner=corner if corner else None,
            box=box,
            inpaint_radius=inpaint_radius,
            dilate_radius=dilate_radius,
            method=method
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xóa watermark: {str(e)}")

