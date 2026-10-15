import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_media_info_invalid_url():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/media/info", json={"url": "not_a_valid_url"})
        assert res.status_code == 400
        data = res.json()
        assert "detail" in data

@pytest.mark.anyio
async def test_media_downloader_service_helper():
    from app.services.media_downloader import extract_media_info
    # Calling with invalid url should raise ValueError
    with pytest.raises(ValueError):
        await extract_media_info("http://invalid-media-target-99999.xyz")
