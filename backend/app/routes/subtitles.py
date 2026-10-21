from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List
import asyncio
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
    if not req.texts:
        return {"translations": []}

    sem = asyncio.Semaphore(10)
    source_lang = req.source_lang or "auto"
    target_lang = req.target_lang or "vi"

    async def _sem_translate(text: str) -> str:
        async with sem:
            return await translate_text(text, source_lang, target_lang)

    results = await asyncio.gather(*[_sem_translate(t) for t in req.texts])
    return {"translations": list(results)}

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
