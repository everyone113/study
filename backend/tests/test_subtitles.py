import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_text_translation():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "Hello world, welcome to computer science class!",
            "source_lang": "en",
            "target_lang": "vi"
        }
        res = await client.post("/api/translate/text", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "translated_text" in data
        assert len(data["translated_text"]) > 0

@pytest.mark.anyio
async def test_srt_parser_and_translator():
    from app.main import app
    sample_srt = """1
00:00:01,000 --> 00:00:03,500
Hello, welcome to our movie.

2
00:00:04,000 --> 00:00:07,000
Enjoy your learning experience!
"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("sub.srt", sample_srt.encode("utf-8"), "text/plain")}
        res = await client.post("/api/subtitles/parse-srt", files=files, data={"target_lang": "vi"})
        assert res.status_code == 200, res.text
        cues = res.json()
        assert len(cues) == 2
        assert cues[0]["start"] == 1.0
        assert cues[0]["end"] == 3.5
        assert "Hello" in cues[0]["text"]
        assert "translated" in cues[0]
