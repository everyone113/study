from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.translator import translate_text, parse_and_translate_srt

router = APIRouter(prefix="/api", tags=["Subtitles & Translation"])

class TranslateRequest(BaseModel):
    text: str = Field(..., examples=["Hello, how are you?"])
    source_lang: Optional[str] = "auto"
    target_lang: Optional[str] = "vi"

class BatchTranslateRequest(BaseModel):
    texts: List[str]
    source_lang: Optional[str] = "auto"
    target_lang: Optional[str] = "vi"

@router.post("/translate/text")
async def translate_single_text(req: TranslateRequest):
    translated = await translate_text(req.text, req.source_lang or "auto", req.target_lang or "vi")
    return {
        "original_text": req.text,
        "translated_text": translated,
        "source_lang": req.source_lang or "auto",
        "target_lang": req.target_lang or "vi"
    }

@router.post("/translate/batch")
async def translate_batch_texts(req: BatchTranslateRequest):
    results = []
    for t in req.texts:
        res = await translate_text(t, req.source_lang or "auto", req.target_lang or "vi")
        results.append(res)
    return {"translations": results}

@router.post("/subtitles/parse-srt")
async def parse_srt_file(
    file: UploadFile = File(...),
    target_lang: Optional[str] = Form("vi")
):
    try:
        content_bytes = await file.read()
        srt_content = content_bytes.decode("utf-8", errors="ignore")
        cues = await parse_and_translate_srt(srt_content, target_lang=target_lang or "vi")
        return cues
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích phụ đề: {str(e)}")
