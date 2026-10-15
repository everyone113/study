import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_health_check():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "StudyMediaHub"
