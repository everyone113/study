import pytest
import io
from PIL import Image
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_flashcards_crud():
    from app.main import app
    from app.database import init_db
    await init_db()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create card
        card_data = {
            "deck_name": "Java OOP",
            "front": "Tính Đa hình (Polymorphism) là gì?",
            "back": "Khả năng một đối tượng có thể mang nhiều hình thái khác nhau, thể hiện qua Overloading và Overriding."
        }
        res = await client.post("/api/tools/flashcards", json=card_data)
        assert res.status_code == 200, res.text
        card = res.json()
        card_id = card["id"]
        assert card["deck_name"] == "Java OOP"

        # List cards
        res_list = await client.get("/api/tools/flashcards?deck_name=Java OOP")
        assert res_list.status_code == 200
        cards = res_list.json()
        assert any(c["id"] == card_id for c in cards)

@pytest.mark.anyio
async def test_tts_generation():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "Chào mừng bạn đến với StudyMediaHub",
            "voice": "vi-VN-HoaiMyNeural"
        }
        res = await client.post("/api/tools/tts", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "audio_url" in data
        assert data["audio_url"].endswith(".mp3")

@pytest.mark.anyio
async def test_bg_removal():
    from app.main import app
    img = Image.new("RGB", (80, 80), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("test_object.png", img_bytes, "image/png")}
        res = await client.post("/api/tools/remove-bg", files=files)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "result_url" in data
        assert data["result_url"].endswith(".png")
