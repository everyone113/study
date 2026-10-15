import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_python_code_execution():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "language": "python",
            "code": "name = input()\nprint(f'Hello {name}!')",
            "stdin": "Antigravity"
        }
        res = await client.post("/api/code/run", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["exit_code"] == 0
        assert "Hello Antigravity!" in data["stdout"]
        assert data["status"] == "success"

@pytest.mark.anyio
async def test_java_code_execution():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        java_code = """
public class Main {
    public static void main(String[] args) {
        int a = 15;
        int b = 27;
        System.out.println("Tong la: " + (a + b));
    }
}
"""
        payload = {
            "language": "java",
            "code": java_code,
            "stdin": ""
        }
        res = await client.post("/api/code/run", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["exit_code"] == 0
        assert "Tong la: 42" in data["stdout"]
        assert data["status"] == "success"

@pytest.mark.anyio
async def test_code_snippets():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/code/snippets")
        assert res.status_code == 200
        snippets = res.json()
        assert "java" in snippets
        assert "cpp" in snippets
        assert len(snippets["java"]) > 0
