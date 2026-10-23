import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db

@pytest.fixture(autouse=True)
async def ensure_db():
    await init_db()

@pytest.mark.anyio
async def test_mindmap_crud_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create mindmap
        payload = {
            "title": "Kiến trúc máy tính & Vi điều khiển",
            "description": "Cấu trúc vi xử lý và tập lệnh RISC-V",
            "tags": "Computer Science",
            "user_id": "usr_test_101",
            "root_node": {
                "id": "root-1",
                "text": "Kiến trúc máy tính",
                "color": "#6366f1",
                "isCollapsed": False,
                "notes": "Tổng quan môn học",
                "children": [
                    {
                        "id": "branch-1",
                        "text": "Phần cứng",
                        "color": "#3b82f6",
                        "isCollapsed": False,
                        "notes": "Các linh kiện vật lý",
                        "children": [
                            {
                                "id": "sub-1",
                                "text": "CPU",
                                "color": "#3b82f6",
                                "isCollapsed": False,
                                "notes": "Bộ xử lý trung tâm",
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "branch-2",
                        "text": "Tập lệnh",
                        "color": "#10b981",
                        "isCollapsed": False,
                        "notes": "ISA",
                        "children": []
                    }
                ]
            }
        }
        res = await client.post("/api/mindmap", json=payload)
        assert res.status_code == 201, res.text
        created = res.json()
        mm_id = created["id"]
        assert mm_id.startswith("mm_")
        assert created["title"] == "Kiến trúc máy tính & Vi điều khiển"
        assert created["node_count"] == 4
        assert created["user_id"] == "usr_test_101"
        assert created["root_node"]["id"] == "root-1"
        assert len(created["root_node"]["children"]) == 2

        # 2. Get mindmap by ID
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["id"] == mm_id
        assert fetched["title"] == "Kiến trúc máy tính & Vi điều khiển"
        assert fetched["node_count"] == 4
        assert fetched["root_data"]["id"] == "root-1"

        # 3. List mindmaps and check search
        res_list = await client.get("/api/mindmap?user_id=usr_test_101")
        assert res_list.status_code == 200
        items = res_list.json()
        assert any(item["id"] == mm_id for item in items)

        res_search = await client.get("/api/mindmap?search=RISC-V")
        assert res_search.status_code == 200
        search_items = res_search.json()
        assert any(item["id"] == mm_id for item in search_items)

        # 4. Update mindmap
        update_payload = {
            "title": "Kiến trúc máy tính nâng cao",
            "description": "Bổ sung Pipeline & Branch Prediction",
            "tags": "Advanced CS"
        }
        res_update = await client.put(f"/api/mindmap/{mm_id}", json=update_payload)
        assert res_update.status_code == 200
        updated = res_update.json()
        assert updated["title"] == "Kiến trúc máy tính nâng cao"
        assert updated["description"] == "Bổ sung Pipeline & Branch Prediction"
        assert updated["tags"] == "Advanced CS"
        assert updated["node_count"] == 4

        # 5. Delete mindmap
        res_del = await client.delete(f"/api/mindmap/{mm_id}")
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "ok"

        # 6. Verify 404 on deleted
        res_get_deleted = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get_deleted.status_code == 404

@pytest.mark.anyio
async def test_mindmap_create_minimal_and_default_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"title": "Ý tưởng dự án tốt nghiệp"}
        res = await client.post("/api/mindmap", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Ý tưởng dự án tốt nghiệp"
        assert data["node_count"] == 1
        assert data["root_node"]["text"] == "Ý tưởng dự án tốt nghiệp"
        assert data["root_node"]["children"] == []

        # Cleanup
        await client.delete(f"/api/mindmap/{data['id']}")

@pytest.mark.anyio
async def test_mindmap_create_and_update_validation_errors():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Empty title in creation -> 400
        res_empty = await client.post("/api/mindmap", json={"title": "   "})
        assert res_empty.status_code == 400

        # Nonexistent ID on update -> 404
        res_404_up = await client.put("/api/mindmap/nonexistent_id", json={"title": "New Title"})
        assert res_404_up.status_code == 404

        # Nonexistent ID on delete -> 404
        res_404_del = await client.delete("/api/mindmap/nonexistent_id")
        assert res_404_del.status_code == 404

@pytest.mark.anyio
async def test_mindmap_generate_from_markdown():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        md_text = """
# Trí Tuệ Nhân Tạo
## Học Máy (Machine Learning)
### Học Có Giám Sát
- Hồi quy tuyến tính
- Hồi quy Logistic
### Học Không Giám Sát
- Phân cụm K-Means
- PCA
## Học Sâu (Deep Learning)
### Mạng Nơ-ron Tích Chập (CNN)
### Mạng Biến Đổi (Transformer)
        """
        payload = {
            "text": md_text,
            "title": "Sơ đồ Tổng Quan AI",
            "save": False
        }
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["title"] == "Sơ đồ Tổng Quan AI"
        assert data["saved"] is False
        assert data["node_count"] >= 10

        root = data["root_node"]
        assert root["text"] == "Sơ đồ Tổng Quan AI"
        assert len(root["children"]) == 2  # Machine Learning and Deep Learning

        ml_branch = root["children"][0]
        assert ml_branch["text"] == "Học Máy (Machine Learning)"
        assert len(ml_branch["children"]) == 2  # Supervised & Unsupervised

@pytest.mark.anyio
async def test_mindmap_generate_from_indented_bullets():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        bullet_text = """
- Frontend Development
  - React 18
    - Hooks
    - Context API
  - Tailwind CSS
- Backend Development
  - FastAPI
  - SQLite
        """
        payload = {
            "text": bullet_text,
            "title": "Lộ Trình Fullstack",
            "save": False
        }
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Lộ Trình Fullstack"
        root = data["root_node"]
        assert len(root["children"]) == 2
        frontend = root["children"][0]
        assert frontend["text"] == "Frontend Development"
        assert len(frontend["children"]) == 2

@pytest.mark.anyio
async def test_mindmap_generate_from_numbered_lists():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        numbered_text = """
1. Chuẩn bị môi trường
   1.1 Cài đặt Python 3.12
   1.2 Cài đặt Node.js 20
2. Xây dựng dịch vụ
   2.1 Viết API RESTful
   2.2 Thiết kế cơ sở dữ liệu
        """
        payload = {
            "text": numbered_text,
            "title": "Quy Trình Phát Triển",
            "save": False
        }
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Quy Trình Phát Triển"
        assert data["node_count"] >= 7

@pytest.mark.anyio
async def test_mindmap_generate_with_save_flag():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        md_text = """
# Lập Trình Hướng Đối Tượng
## 4 Tính Chất Cốt Lõi
- Đóng gói (Encapsulation)
- Kế thừa (Inheritance)
- Đa hình (Polymorphism)
- Trừu tượng (Abstraction)
        """
        payload = {
            "text": md_text,
            "title": "Lập Trình Hướng Đối Tượng OOP",
            "user_id": "usr_oop_student",
            "save": True
        }
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["saved"] is True
        assert "id" in data
        mm_id = data["id"]

        # Verify mindmap was actually saved to SQLite
        res_fetch = await client.get(f"/api/mindmap/{mm_id}")
        assert res_fetch.status_code == 200
        fetched = res_fetch.json()
        assert fetched["title"] == "Lập Trình Hướng Đối Tượng OOP"
        assert fetched["node_count"] == 6

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")

@pytest.mark.anyio
async def test_mindmap_generate_empty_error():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/mindmap/generate", json={"text": "   "})
        assert res.status_code == 400
        assert "cannot be empty" in res.json()["detail"].lower()

@pytest.mark.anyio
async def test_mindmap_export_to_flashcards():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a mindmap with branches and notes
        create_res = await client.post("/api/mindmap", json={
            "title": "Mạng Máy Tính (Computer Networks)",
            "root_node": {
                "id": "root",
                "text": "Mô Hình OSI 7 Tầng",
                "color": "#6366f1",
                "isCollapsed": False,
                "notes": "Mô hình tham chiếu mạng",
                "children": [
                    {
                        "id": "c1",
                        "text": "Tầng Ứng dụng (Application)",
                        "color": "#3b82f6",
                        "isCollapsed": False,
                        "notes": "HTTP, HTTPS, DNS, FTP",
                        "children": [
                            {"id": "sub1", "text": "HTTP/HTTPS", "color": "#3b82f6", "notes": "Port 80 và 443", "children": []}
                        ]
                    },
                    {
                        "id": "c2",
                        "text": "Tầng Giao vận (Transport)",
                        "color": "#10b981",
                        "isCollapsed": False,
                        "notes": "TCP và UDP",
                        "children": []
                    }
                ]
            }
        })
        assert create_res.status_code == 201
        mm = create_res.json()
        mm_id = mm["id"]

        # Export to flashcards
        deck_name = f"Test Deck {mm_id}"
        export_res = await client.post(f"/api/mindmap/{mm_id}/export-flashcards", json={
            "deck_name": deck_name
        })
        assert export_res.status_code == 200
        export_data = export_res.json()
        assert export_data["status"] == "ok"
        assert export_data["deck_name"] == deck_name
        assert export_data["exported_count"] >= 2

        # Check that flashcards endpoint returns the cards
        cards_res = await client.get(f"/api/tools/flashcards?deck_name={deck_name}")
        assert cards_res.status_code == 200
        cards = cards_res.json()
        assert len(cards) >= 2

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")
        for c in cards:
            await client.delete(f"/api/tools/flashcards/{c['id']}")

@pytest.mark.anyio
async def test_mindmap_custom_flashcards_export():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_name = "Custom Mindmap Flashcards Deck"
        payload = {
            "deck_name": deck_name,
            "cards": [
                {"front": "Thuật toán Dijkstra dùng để làm gì?", "back": "Tìm đường đi ngắn nhất từ một đỉnh nguồn trong đồ thị có trọng số không âm."},
                {"front": "Độ phức tạp thuật toán QuickSort?", "back": "Trung bình O(N log N), trường hợp xấu nhất O(N^2)."}
            ]
        }
        res = await client.post("/api/mindmap/export-flashcards", json=payload)
        assert res.status_code == 200
        assert res.json()["exported_count"] == 2

        # Verify cards
        cards_res = await client.get(f"/api/tools/flashcards?deck_name={deck_name}")
        assert cards_res.status_code == 200
        cards = cards_res.json()
        assert len(cards) == 2

        # Cleanup
        for c in cards:
            await client.delete(f"/api/tools/flashcards/{c['id']}")
