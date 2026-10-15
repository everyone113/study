import pytest
import io
import hashlib
from PIL import Image
from httpx import AsyncClient, ASGITransport

def get_bytes_md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

@pytest.mark.anyio
async def test_anti_duplicate_image():
    from app.main import app
    # Create a simple test image in memory
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    orig_bytes = buf.getvalue()
    orig_md5 = get_bytes_md5(orig_bytes)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {
            "file": ("test_image.jpg", orig_bytes, "image/jpeg")
        }
        res = await client.post("/api/media/anti-duplicate/image", files=files, data={"mode": "smart"})
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["original_md5"] == orig_md5
        assert data["new_md5"] != orig_md5
        assert data["processed_url"].startswith("/static/processed/")
