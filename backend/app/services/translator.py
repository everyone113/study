import re
import httpx
from typing import List, Dict, Any, Optional

TRANSLATION_CACHE: Dict[str, str] = {}

async def translate_text(text: str, source_lang: str = "auto", target_lang: str = "vi") -> str:
    text = text.strip()
    if not text:
        return ""

    cache_key = f"{source_lang}->{target_lang}:{text}"
    if cache_key in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[cache_key]

    # Google Translate Web API (free & fast)
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": source_lang if source_lang != "auto" else "auto",
        "tl": target_lang,
        "dt": "t",
        "q": text
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                translated = "".join([segment[0] for segment in data[0] if segment and segment[0]])
                TRANSLATION_CACHE[cache_key] = translated
                return translated
    except Exception:
        pass

    # Fallback to MyMemory translation
    try:
        mm_url = "https://api.mymemory.translated.net/get"
        mm_params = {
            "q": text,
            "langpair": f"{'en' if source_lang == 'auto' else source_lang}|{target_lang}"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(mm_url, params=mm_params)
            if response.status_code == 200:
                data = response.json()
                trans = data.get("responseData", {}).get("translatedText")
                if trans:
                    TRANSLATION_CACHE[cache_key] = trans
                    return trans
    except Exception:
        pass

    return text # Return original if offline/error

def srt_time_to_seconds(time_str: str) -> float:
    # 00:00:01,000 or 00:00:01.000
    time_str = time_str.replace(",", ".").strip()
    parts = time_str.split(":")
    if len(parts) == 3:
        h = float(parts[0])
        m = float(parts[1])
        s = float(parts[2])
        return h * 3600 + m * 60 + s
    elif len(parts) == 2:
        m = float(parts[0])
        s = float(parts[1])
        return m * 60 + s
    return 0.0

async def parse_and_translate_srt(srt_content: str, target_lang: str = "vi") -> List[Dict[str, Any]]:
    # Split blocks separated by blank lines
    blocks = re.split(r'\n\s*\n', srt_content.strip())
    cues = []

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if len(lines) < 2:
            continue

        # Look for time arrow '-->'
        time_line_idx = -1
        for idx, line in enumerate(lines):
            if "-->" in line:
                time_line_idx = idx
                break

        if time_line_idx == -1:
            continue

        time_line = lines[time_line_idx]
        text_lines = lines[time_line_idx + 1:]
        text = " ".join(text_lines)

        time_parts = time_line.split("-->")
        start_sec = srt_time_to_seconds(time_parts[0])
        end_sec = srt_time_to_seconds(time_parts[1])

        cues.append({
            "id": len(cues) + 1,
            "start": round(start_sec, 2),
            "end": round(end_sec, 2),
            "text": text,
            "translated": ""
        })

    # Translate first 30 cues or batch
    for cue in cues:
        cue["translated"] = await translate_text(cue["text"], "auto", target_lang)

    return cues
