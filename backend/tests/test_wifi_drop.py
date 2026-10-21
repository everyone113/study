import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.config import DROP_DIR

client = TestClient(app)

def test_get_network_info():
    response = client.get("/api/drop/network-info")
    assert response.status_code == 200
    data = response.json()
    assert "local_ip" in data
    assert "upload_url" in data
    assert "drop" in data["upload_url"]
    assert "frontend_url" in data
    assert "5173" in data["frontend_url"]

def test_upload_and_list_and_delete_dropped_files():
    # 1. Upload mock photo files
    file1 = ("test_image1.png", io.BytesIO(b"dummy image 1 content"), "image/png")
    file2 = ("test_image2.jpg", io.BytesIO(b"dummy image 2 content"), "image/jpeg")

    upload_resp = client.post(
        "/api/drop/upload",
        files=[("files", file1), ("files", file2)]
    )
    assert upload_resp.status_code == 200
    res_data = upload_resp.json()
    assert res_data["status"] == "success"
    assert len(res_data["files"]) == 2
    uploaded_files = res_data["files"]
    assert uploaded_files[0]["file_type"] == "image"

    # 2. List files
    list_resp = client.get("/api/drop/files")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) >= 2
    filenames = [item["filename"] for item in items]
    assert uploaded_files[0]["filename"] in filenames
    assert uploaded_files[1]["filename"] in filenames

    # 3. Delete single file
    first_file = uploaded_files[0]["filename"]
    del_resp = client.delete(f"/api/drop/files/{first_file}")
    assert del_resp.status_code == 200

    # 4. Clear all
    clear_resp = client.delete("/api/drop/clear")
    assert clear_resp.status_code == 200
    list_after_clear = client.get("/api/drop/files").json()
    assert len(list_after_clear) == 0
