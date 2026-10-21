import pytest
import io
import hashlib
import subprocess
import shutil
from pathlib import Path
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
        assert "original_sha256" in data
        assert "new_sha256" in data

@pytest.mark.anyio
async def test_anti_duplicate_video():
    if not shutil.which("ffmpeg"):
        pytest.skip("FFmpeg not installed")

    from app.main import app
    temp_video = Path("temp_test_video.mp4")
    try:
        # Generate 0.5s synthetic test video
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=duration=0.5:size=160x120:rate=10",
            "-c:v", "libx264", str(temp_video)
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        video_bytes = temp_video.read_bytes()
        orig_md5 = get_bytes_md5(video_bytes)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            files = {
                "file": ("test_video.mp4", video_bytes, "video/mp4")
            }
            res = await client.post(
                "/api/media/anti-duplicate/video",
                files=files,
                data={"speed_factor": "1.008", "micro_zoom": "true"}
            )
            assert res.status_code == 200, res.text
            data = res.json()
            assert data["original_md5"] == orig_md5
            assert data["new_md5"] != orig_md5
            assert data["processed_url"].startswith("/static/processed/")
            assert "original_sha256" in data
            assert "new_sha256" in data
    finally:
        if temp_video.exists():
            temp_video.unlink(missing_ok=True)
