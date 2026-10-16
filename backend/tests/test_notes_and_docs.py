import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_notes_crud_and_toggle():
    from app.main import app
    from app.database import init_db
    await init_db()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create a note
        note_data = {
            "title": "Nộp bài tập lớn Java OOP",
            "content": "Hoàn thiện cấu trúc Class và file README",
            "remind_at": "2026-10-20T08:00:00",
            "deadline": "2026-10-25T23:59:00",
            "priority": "high",
            "tag": "Bài tập"
        }
        res = await client.post("/api/notes", json=note_data)
        assert res.status_code == 200, res.text
        note = res.json()
        note_id = note["id"]
        assert note["title"] == "Nộp bài tập lớn Java OOP"
        assert note["is_completed"] == 0

        # 2. Toggle note status
        res_toggle = await client.put(f"/api/notes/{note_id}/toggle")
        assert res_toggle.status_code == 200
        assert res_toggle.json()["is_completed"] == 1

        # 3. List notes
        res_list = await client.get("/api/notes")
        assert res_list.status_code == 200
        notes = res_list.json()
        assert any(n["id"] == note_id for n in notes)

        # 4. Delete note by ID
        res_del = await client.delete(f"/api/notes/{note_id}")
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "ok"

        # Verify it's deleted
        res_list_after = await client.get("/api/notes")
        assert not any(n["id"] == note_id for n in res_list_after.json())

        # 5. Delete all completed notes
        res_del_completed = await client.delete("/api/notes/completed")
        assert res_del_completed.status_code == 200
        assert res_del_completed.json()["status"] == "ok"

@pytest.mark.anyio
async def test_document_download_url_and_list():
    from app.main import app
    from app.database import init_db
    await init_db()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Mock download of an existing web resource (e.g. example or test endpoint)
        doc_payload = {
            "title": "Tài liệu mẫu",
            "url": "https://httpbin.org/robots.txt"
        }
        res = await client.post("/api/documents/download-url", json=doc_payload)
        # Should return 200 or successful download metadata
        assert res.status_code in [200, 201], res.text
        doc = res.json()
        assert doc["title"] == "Tài liệu mẫu"
        assert doc["file_size"] > 0
        doc_id = doc["id"]

        # List documents
        res_list = await client.get("/api/documents")
        assert res_list.status_code == 200
        docs = res_list.json()
        assert any(d["id"] == doc_id for d in docs)
