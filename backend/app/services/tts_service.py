import time
import uuid
import asyncio
from app.config import PROCESSED_DIR

VOICES = [
    {"id": "vi-VN-HoaiMyNeural", "name": "Hoài My (Nữ - Miền Bắc)", "lang": "vi-VN"},
    {"id": "vi-VN-NamMinhNeural", "name": "Nam Minh (Nam - Miền Bắc)", "lang": "vi-VN"},
    {"id": "en-US-JennyNeural", "name": "Jenny (Nữ - US)", "lang": "en-US"},
    {"id": "en-US-GuyNeural", "name": "Guy (Nam - US)", "lang": "en-US"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Nữ - Nhật)", "lang": "ja-JP"},
]

async def generate_speech(text: str, voice: str = "vi-VN-HoaiMyNeural", rate: str = "+0%", pitch: str = "+0Hz") -> dict:
    text = text.strip()
    if not text:
        raise ValueError("Văn bản chuyển đổi giọng nói không được để trống.")

    voice_ids = [v["id"] for v in VOICES]
    if voice not in voice_ids:
        voice = "vi-VN-HoaiMyNeural"

    filename = f"tts_{int(time.time())}_{uuid.uuid4().hex[:6]}.mp3"
    dest_path = PROCESSED_DIR / filename

    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(str(dest_path))
    except Exception as e:
        # Fallback to gTTS if edge-tts is blocked or network error
        try:
            from gtts import gTTS
            lang = "vi" if "vi" in voice else ("ja" if "ja" in voice else "en")
            loop = asyncio.get_event_loop()
            def _gtts():
                tts = gTTS(text=text, lang=lang, slow=False)
                tts.save(str(dest_path))
            await loop.run_in_executor(None, _gtts)
        except Exception as e2:
            raise RuntimeError(f"Lỗi khi tổng hợp giọng nói: {str(e2)}")

    return {
        "filename": filename,
        "audio_url": f"/static/processed/{filename}",
        "file_size": dest_path.stat().st_size,
        "voice": voice,
        "text_preview": (text[:100] + "...") if len(text) > 100 else text
    }
