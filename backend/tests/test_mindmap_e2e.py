"""
E2E Test Suite for AI Mindmap Studio & Focus Soundscapes (StudyMediaHub)
Author: test_writer_e2e_1 (E2E Test Architect)
Covers all 4 Tiers:
- Tier 1: Feature Coverage (CRUD, Generator, Flashcard Export, TTS Speech)
- Tier 2: Boundary & Corner Cases (Empty text, 404/422, Deep nesting 20 levels, Level jumps, Unicode/VN diacritics, XSS escaping, Single node, Scale)
- Tier 3: Cross-Feature Combinations (Generate -> Edit -> Flashcards, Mindmap -> TTS, Multi-mindmap lifecycle)
- Tier 4: Real-World Scenarios (OS Lecture Notes, Medical Pharmacology Taxonomy, Fullstack Coding Roadmap)
"""

import pytest
import uuid
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure database schema is initialized before every test."""
    await init_db()


# ==============================================================================
# TIER 1: FEATURE COVERAGE (ISOLATED FUNCTIONALITY)
# ==============================================================================

@pytest.mark.anyio
async def test_tier1_crud_create_minimal():
    """Tier 1: Verify POST /api/mindmap creates a minimal mindmap with title and default root node."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Sơ đồ tối giản",
            "tags": "Testing"
        }
        res = await client.post("/api/mindmap", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["id"].startswith("mm_")
        assert data["title"] == "Sơ đồ tối giản"
        assert data["tags"] == "Testing"
        assert data["root_node"]["id"] == "node-root"
        assert data["root_node"]["text"] == "Sơ đồ tối giản"
        assert data["node_count"] >= 1
        assert "created_at" in data
        assert "updated_at" in data


@pytest.mark.anyio
async def test_tier1_crud_create_hierarchical():
    """Tier 1: Verify POST /api/mindmap persists a full multi-level tree with custom colors and properties."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tree = {
            "id": "node-root",
            "text": "Kiến trúc máy tính",
            "color": "#6366f1",
            "isCollapsed": False,
            "children": [
                {
                    "id": "node-cpu",
                    "text": "CPU",
                    "color": "#3b82f6",
                    "children": [
                        {"id": "node-alu", "text": "ALU", "color": "#3b82f6", "children": []},
                        {"id": "node-cu", "text": "Control Unit", "color": "#3b82f6", "children": []}
                    ]
                },
                {
                    "id": "node-ram",
                    "text": "Bộ nhớ trong",
                    "color": "#10b981",
                    "children": [
                        {"id": "node-sram", "text": "SRAM", "color": "#10b981", "children": []},
                        {"id": "node-dram", "text": "DRAM", "color": "#10b981", "children": []}
                    ]
                }
            ]
        }
        payload = {
            "title": "Cấu trúc máy tính chi tiết",
            "description": "Bài học phần cứng máy tính",
            "root_node": tree,
            "tags": "Hardware,CS",
            "user_id": "student_01"
        }
        res = await client.post("/api/mindmap", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["title"] == "Cấu trúc máy tính chi tiết"
        assert data["node_count"] == 7
        assert len(data["root_node"]["children"]) == 2
        assert len(data["root_node"]["children"][0]["children"]) == 2


@pytest.mark.anyio
async def test_tier1_crud_list_and_search():
    """Tier 1: Verify GET /api/mindmap returns list with summaries and supports search filtering."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        uid = uuid.uuid4().hex[:6]
        title_a = f"Trí tuệ nhân tạo {uid}"
        title_b = f"Học máy cơ bản {uid}"
        
        await client.post("/api/mindmap", json={"title": title_a, "tags": f"AI_{uid}"})
        await client.post("/api/mindmap", json={"title": title_b, "tags": f"ML_{uid}"})

        # List all
        res_list = await client.get("/api/mindmap")
        assert res_list.status_code == 200
        items = res_list.json()
        assert any(item["title"] == title_a for item in items)
        assert any(item["title"] == title_b for item in items)

        # Search by keyword
        res_search = await client.get(f"/api/mindmap?search={uid}")
        assert res_search.status_code == 200
        search_items = res_search.json()
        assert len(search_items) >= 2
        assert all(uid in item["title"] or uid in item["tags"] for item in search_items)


@pytest.mark.anyio
async def test_tier1_crud_get_single():
    """Tier 1: Verify GET /api/mindmap/{id} returns full mindmap details and parsed root node."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_create = await client.post("/api/mindmap", json={"title": "Độc lập kiểm thử đơn bản"})
        assert res_create.status_code == 201
        created = res_create.json()
        mm_id = created["id"]

        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["id"] == mm_id
        assert fetched["title"] == "Độc lập kiểm thử đơn bản"
        assert isinstance(fetched["root_node"], dict)
        assert fetched["root_node"]["text"] == "Độc lập kiểm thử đơn bản"


@pytest.mark.anyio
async def test_tier1_crud_update_metadata_and_tree():
    """Tier 1: Verify PUT /api/mindmap/{id} updates title, description, root tree and tags."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_create = await client.post("/api/mindmap", json={"title": "Tiêu đề cũ", "tags": "V1"})
        mm_id = res_create.json()["id"]

        new_tree = {
            "id": "node-root",
            "text": "Tiêu đề mới cập nhật",
            "color": "#8b5cf6",
            "children": [
                {"id": "node-sub1", "text": "Nhánh bổ sung", "children": []}
            ]
        }
        update_payload = {
            "title": "Tiêu đề mới cập nhật",
            "description": "Mô tả mới",
            "root_node": new_tree,
            "tags": "V2,Updated"
        }
        res_update = await client.put(f"/api/mindmap/{mm_id}", json=update_payload)
        assert res_update.status_code == 200
        updated = res_update.json()
        assert updated["title"] == "Tiêu đề mới cập nhật"
        assert updated["description"] == "Mô tả mới"
        assert updated["tags"] == "V2,Updated"
        assert updated["node_count"] == 2
        assert updated["root_node"]["text"] == "Tiêu đề mới cập nhật"


@pytest.mark.anyio
async def test_tier1_crud_delete():
    """Tier 1: Verify DELETE /api/mindmap/{id} removes the mindmap and subsequent GET yields 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_create = await client.post("/api/mindmap", json={"title": "Sẽ bị xóa ngay"})
        mm_id = res_create.json()["id"]

        # Delete
        res_del = await client.delete(f"/api/mindmap/{mm_id}")
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "ok"

        # Subsequent GET must be 404
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 404


@pytest.mark.anyio
async def test_tier1_generate_markdown_headers():
    """Tier 1: Verify POST /api/mindmap/generate parses Markdown headers (#, ##, ###) into hierarchical tree."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        md_text = """
# Lập trình Web Hiện đại
## Frontend
### React 18
### Tailwind CSS
## Backend
### FastAPI
### SQLite
"""
        payload = {"text": md_text, "title": "Web Tech"}
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Web Tech"
        root = data["root_node"]
        assert root["text"] == "Web Tech"
        # 2 main children: Frontend, Backend
        assert len(root["children"]) == 2
        frontend = root["children"][0]
        assert frontend["text"] == "Frontend"
        assert len(frontend["children"]) == 2
        assert frontend["children"][0]["text"] == "React 18"
        assert frontend["children"][1]["text"] == "Tailwind CSS"


@pytest.mark.anyio
async def test_tier1_generate_indented_bullets():
    """Tier 1: Verify POST /api/mindmap/generate parses bullet points with indentation levels."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        bullet_text = """
- Chủ đề trung tâm
  - Nhánh Alpha
    - Điểm con A1
    - Điểm con A2
  - Nhánh Beta
    - Điểm con B1
"""
        payload = {"text": bullet_text}
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        root = data["root_node"]
        assert root["text"] == "Chủ đề trung tâm"
        assert len(root["children"]) == 2
        alpha = root["children"][0]
        assert alpha["text"] == "Nhánh Alpha"
        assert len(alpha["children"]) == 2


@pytest.mark.anyio
async def test_tier1_generate_numbered_lists():
    """Tier 1: Verify POST /api/mindmap/generate parses numbered outline format (1., 1.1, 1.2)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        numbered_text = """
1. Nguyên lý Thiết kế
   1.1 Khả năng bảo trì
   1.2 Hiệu năng cao
2. Kiến trúc Hệ thống
   2.1 Client Server
   2.2 Microservices
"""
        payload = {"text": numbered_text, "title": "Software Architecture"}
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        root = data["root_node"]
        assert len(root["children"]) == 2
        assert "Nguyên lý Thiết kế" in root["children"][0]["text"]


@pytest.mark.anyio
async def test_tier1_generate_with_auto_save():
    """Tier 1: Verify POST /api/mindmap/generate with save=True automatically stores in SQLite."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "# Trí tuệ Nhân tạo\n## Học sâu\n## Thị giác máy tính",
            "title": "AI Roadmap 2026",
            "save": True
        }
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["saved"] is True
        assert "id" in data
        mm_id = data["id"]

        # Confirm persisted in DB
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        assert res_get.json()["title"] == "AI Roadmap 2026"


@pytest.mark.anyio
async def test_tier1_flashcard_export_endpoint():
    """Tier 1: Verify POST /api/mindmap/{id}/export-flashcards populates the flashcards database."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_tag = f"TestDeck_{uuid.uuid4().hex[:6]}"
        tree = {
            "id": "node-root",
            "text": "Giải thuật Tìm kiếm",
            "color": "#6366f1",
            "children": [
                {
                    "id": "node-bfs",
                    "text": "BFS (Breadth-First Search)",
                    "notes": "Duyệt theo chiều rộng dùng Hàng đợi Queue.",
                    "children": []
                },
                {
                    "id": "node-dfs",
                    "text": "DFS (Depth-First Search)",
                    "notes": "Duyệt theo chiều sâu dùng Ngăn xếp Stack.",
                    "children": []
                }
            ]
        }
        res_create = await client.post("/api/mindmap", json={"title": "Thuật toán đồ thị", "root_node": tree})
        mm_id = res_create.json()["id"]

        # Export flashcards
        res_export = await client.post(f"/api/mindmap/{mm_id}/export-flashcards", json={"deck_name": deck_tag})
        assert res_export.status_code == 200
        export_data = res_export.json()
        assert export_data["status"] == "ok"
        assert export_data["exported_count"] >= 1
        assert export_data["deck_name"] == deck_tag

        # Verify flashcards accessible via StudyMediaHub flashcard endpoint
        res_fc = await client.get(f"/api/tools/flashcards?deck_name={deck_tag}")
        assert res_fc.status_code == 200
        cards = res_fc.json()
        assert len(cards) == export_data["exported_count"]
        assert any("Giải thuật Tìm kiếm" in c["front"] for c in cards)


@pytest.mark.anyio
async def test_tier1_tts_node_speech_integration():
    """Tier 1: Verify TTS speech endpoint generates voice audio for mindmap node content."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        node_text = "Mô hình ngôn ngữ lớn (Large Language Model) biến đổi cách con người tương tác với dữ liệu."
        tts_payload = {
            "text": node_text,
            "voice": "vi-VN-HoaiMyNeural",
            "rate": "+0%",
            "pitch": "+0Hz"
        }
        res = await client.post("/api/tools/tts", json=tts_payload)
        assert res.status_code == 200
        data = res.json()
        assert "audio_url" in data
        assert data["audio_url"].endswith(".mp3")


# ==============================================================================
# TIER 2: BOUNDARY & CORNER CASES
# ==============================================================================

@pytest.mark.anyio
async def test_tier2_empty_text_generator_error():
    """Tier 2: Empty or whitespace text to generator returns HTTP 400."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/mindmap/generate", json={"text": "   \n\t  "})
        assert res.status_code == 400
        assert "empty" in res.json()["detail"].lower()


@pytest.mark.anyio
async def test_tier2_create_missing_or_blank_title():
    """Tier 2: Missing title or blank title string in POST /api/mindmap returns 400 or 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Blank title
        res_blank = await client.post("/api/mindmap", json={"title": "   "})
        assert res_blank.status_code in (400, 422)

        # Missing title field
        res_missing = await client.post("/api/mindmap", json={"description": "No title here"})
        assert res_missing.status_code == 422


@pytest.mark.anyio
async def test_tier2_get_nonexistent_id_404():
    """Tier 2: GET non-existent mindmap ID returns HTTP 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/mindmap/mm_nonexistent_999999")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()


@pytest.mark.anyio
async def test_tier2_update_nonexistent_id_404():
    """Tier 2: PUT non-existent mindmap ID returns HTTP 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.put("/api/mindmap/mm_ghost_id", json={"title": "Cập nhật bóng ma"})
        assert res.status_code == 404


@pytest.mark.anyio
async def test_tier2_delete_nonexistent_id_404():
    """Tier 2: DELETE non-existent mindmap ID returns HTTP 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.delete("/api/mindmap/mm_nonexistent_id")
        assert res.status_code == 404


@pytest.mark.anyio
async def test_tier2_export_flashcards_nonexistent_id_404():
    """Tier 2: Export flashcards from non-existent mindmap returns HTTP 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/mindmap/mm_invalid_id/export-flashcards", json={"deck_name": "GhostDeck"})
        assert res.status_code == 404


@pytest.mark.anyio
async def test_tier2_deep_nested_tree_20_levels():
    """Tier 2: Handles deep hierarchical nesting up to 20 levels without stack overflow or crashing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        lines = ["- Level 0 Root"]
        for i in range(1, 21):
            indent = "  " * i
            lines.append(f"{indent}- Level {i} Node")
        nested_markdown = "\n".join(lines)

        payload = {"text": nested_markdown}
        res = await client.post("/api/mindmap/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        root = data["root_node"]
        assert root["text"] == "Level 0 Root"

        # Walk through children to verify depth reached 20
        curr = root
        depth = 0
        while curr.get("children"):
            curr = curr["children"][0]
            depth += 1
        assert depth == 20, f"Expected 20 levels of nesting, got {depth}"


@pytest.mark.anyio
async def test_tier2_abrupt_heading_level_jump():
    """Tier 2: Heading jumping from # Level 0 directly to #### Level 3 is gracefully parsed without breaking."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        text = """
# Tiêu đề gốc
#### Nhánh nhảy vọt cấp 4
- Điểm phụ thuộc
"""
        res = await client.post("/api/mindmap/generate", json={"text": text})
        assert res.status_code == 200
        data = res.json()
        root = data["root_node"]
        assert len(root["children"]) >= 1
        child = root["children"][0]
        assert "Nhánh nhảy vọt" in child["text"]


@pytest.mark.anyio
async def test_tier2_unicode_vietnamese_text_integrity():
    """Tier 2: Preserves Vietnamese diacritics, mathematical notation, and emojis across database cycles."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        complex_text = "Toán rời rạc: Định lý Fermat & Tích phân ∫ f(x)dx, Tổng ∑ i=1..n; Ký tự đặc biệt: <>&'\" 🎯 🚀"
        payload = {
            "title": "Ký tự tiếng Việt & Toán học",
            "description": complex_text,
            "root_node": {
                "id": "node-root",
                "text": complex_text,
                "color": "#6366f1",
                "children": [
                    {"id": "node-vn-1", "text": "Tiếng Việt có dấu: ắ, ề, ỗ, ứ, đ, ỹ", "children": []}
                ]
            }
        }
        res_create = await client.post("/api/mindmap", json=payload)
        assert res_create.status_code == 201
        mm_id = res_create.json()["id"]

        # Fetch and verify verbatim integrity
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["description"] == complex_text
        assert fetched["root_node"]["text"] == complex_text
        assert fetched["root_node"]["children"][0]["text"] == "Tiếng Việt có dấu: ắ, ề, ỗ, ứ, đ, ỹ"


@pytest.mark.anyio
async def test_tier2_single_node_tree_export():
    """Tier 2: Export flashcards on a mindmap with only 1 root node succeeds with fallback card."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tree = {
            "id": "node-root",
            "text": "Nút đơn độc lập",
            "color": "#6366f1",
            "children": []
        }
        res_create = await client.post("/api/mindmap", json={"title": "Đơn nút", "root_node": tree})
        mm_id = res_create.json()["id"]

        res_export = await client.post(f"/api/mindmap/{mm_id}/export-flashcards")
        assert res_export.status_code == 200
        data = res_export.json()
        assert data["exported_count"] == 1
        assert data["cards"][0]["front"] == "Nút đơn độc lập"


@pytest.mark.anyio
async def test_tier2_extreme_scale_mindmap():
    """Tier 2: Mindmap with 100+ nodes persists, retrieves and computes node_count accurately."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        children = []
        for i in range(10):
            sub_children = [{"id": f"node-sub-{i}-{j}", "text": f"Sub {i}.{j}", "children": []} for j in range(10)]
            children.append({
                "id": f"node-branch-{i}",
                "text": f"Branch {i}",
                "children": sub_children
            })
        root = {
            "id": "node-root",
            "text": "Quy mô lớn 101 nodes",
            "children": children
        }
        res = await client.post("/api/mindmap", json={"title": "Quy mô 101 nút", "root_node": root})
        assert res.status_code == 201
        data = res.json()
        # 1 root + 10 branches + 100 sub = 111 nodes
        assert data["node_count"] == 111


# ==============================================================================
# TIER 3: CROSS-FEATURE COMBINATIONS
# ==============================================================================

@pytest.mark.anyio
async def test_tier3_pipeline_generate_edit_export_flashcards():
    """Tier 3: Full end-to-end user workflow:
    1. Parse Markdown outline to Mindmap tree with auto-save.
    2. Retrieve created mindmap and add an additional child branch.
    3. Update mindmap via PUT.
    4. Export mindmap to Flashcards deck.
    5. Query StudyMediaHub flashcards API to verify deck persistence and contents.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_name = f"PipelineDeck_{uuid.uuid4().hex[:6]}"
        initial_markdown = """
# Lập Trình Hướng Đối Tượng (OOP)
## Tính Đóng Gói (Encapsulation)
## Tính Kế Thừa (Inheritance)
## Tính Đa Hình (Polymorphism)
"""
        # Step 1: Generate with auto-save
        gen_res = await client.post("/api/mindmap/generate", json={
            "text": initial_markdown,
            "save": True
        })
        assert gen_res.status_code == 200
        mm_id = gen_res.json()["id"]

        # Step 2: Fetch created mindmap
        get_res = await client.get(f"/api/mindmap/{mm_id}")
        assert get_res.status_code == 200
        tree = get_res.json()["root_node"]
        assert len(tree["children"]) == 3

        # Step 3: Add 4th pillar "Tính Trừu Tượng" (Abstraction) and update
        tree["children"].append({
            "id": "node-abs",
            "text": "Tính Trừu Tượng (Abstraction)",
            "notes": "Ẩn chi tiết cài đặt và chỉ hiển thị tính năng.",
            "children": []
        })
        put_res = await client.put(f"/api/mindmap/{mm_id}", json={
            "title": "OOP 4 Trụ Cột Hoàn Chỉnh",
            "root_node": tree
        })
        assert put_res.status_code == 200
        assert put_res.json()["node_count"] == 5

        # Step 4: Export to flashcards
        export_res = await client.post(f"/api/mindmap/{mm_id}/export-flashcards", json={
            "deck_name": deck_name
        })
        assert export_res.status_code == 200
        assert export_res.json()["exported_count"] >= 1

        # Step 5: Query flashcards API
        fc_res = await client.get(f"/api/tools/flashcards?deck_name={deck_name}")
        assert fc_res.status_code == 200
        deck_cards = fc_res.json()
        assert len(deck_cards) >= 1
        assert any("Lập Trình Hướng Đối Tượng" in c["front"] for c in deck_cards)


@pytest.mark.anyio
async def test_tier3_pipeline_mindmap_tts_multinode():
    """Tier 3: Create mindmap tree, extract leaf notes, and request TTS audio synthesis for each."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tree = {
            "id": "node-root",
            "text": "Vật Lý Lượng Tử",
            "children": [
                {
                    "id": "node-c1",
                    "text": "Lưỡng tính sóng hạt",
                    "notes": "Ánh sáng vừa có tính chất sóng vừa có tính chất hạt.",
                    "children": []
                },
                {
                    "id": "node-c2",
                    "text": "Nguyên lý bất định Heisenberg",
                    "notes": "Không thể xác định đồng thời cả vị trí và vận tốc của một hạt vi mô.",
                    "children": []
                }
            ]
        }
        res_create = await client.post("/api/mindmap", json={"title": "Vật lý hiện đại", "root_node": tree})
        assert res_create.status_code == 201

        # Trigger TTS for each child node
        for child in tree["children"]:
            text_to_speak = f"{child['text']}: {child['notes']}"
            res_tts = await client.post("/api/tools/tts", json={
                "text": text_to_speak,
                "voice": "vi-VN-HoaiMyNeural"
            })
            assert res_tts.status_code == 200
            assert res_tts.json()["audio_url"].endswith(".mp3")


@pytest.mark.anyio
async def test_tier3_pipeline_multi_mindmap_batch_lifecycle():
    """Tier 3: Multi-mindmap creation, tag searching, selective deletion, and isolation verification."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        batch_id = uuid.uuid4().hex[:6]
        subjects = ["Toán", "Lý", "Hóa", "Sinh", "Tin"]
        created_ids = []

        for sub in subjects:
            res = await client.post("/api/mindmap", json={
                "title": f"Môn học {sub} ({batch_id})",
                "tags": f"Semester_{batch_id},{sub}"
            })
            assert res.status_code == 201
            created_ids.append(res.json()["id"])

        assert len(created_ids) == 5

        # Search by tag
        res_tag = await client.get(f"/api/mindmap?search=Semester_{batch_id}")
        assert res_tag.status_code == 200
        assert len(res_tag.json()) == 5

        # Delete 3 of them
        for mid in created_ids[:3]:
            res_del = await client.delete(f"/api/mindmap/{mid}")
            assert res_del.status_code == 200

        # Verify only 2 remain
        res_tag_after = await client.get(f"/api/mindmap?search=Semester_{batch_id}")
        assert res_tag_after.status_code == 200
        assert len(res_tag_after.json()) == 2


# ==============================================================================
# TIER 4: REAL-WORLD APPLICATION SCENARIOS
# ==============================================================================

@pytest.mark.anyio
async def test_tier4_scenario_lecture_note_operating_systems():
    """Tier 4 Real-World Scenario 1: University Operating Systems Lecture Note study flow.
    Converts full Vietnamese lecture notes on OS concepts into a mindmap, checks topology,
    and converts to an exam review flashcard deck.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_name = f"Exam_OS_{uuid.uuid4().hex[:6]}"
        lecture_note = """
# Hệ Điều Hành & Kiến Trúc Máy Tính
## Quản lý Tiến trình (Process Management)
### Trạng thái tiến trình: Ready, Running, Waiting
### Giải thuật điều độ CPU: FCFS, SJF, Round Robin
### Bế tắc (Deadlock): 4 điều kiện Coffman
## Quản lý Bộ nhớ (Memory Management)
### Phân đoạn (Segmentation) & Phân trang (Paging)
### Bộ nhớ ảo (Virtual Memory) & Bảng trang (Page Table)
### Thuật toán thay thế trang: LRU, FIFO, Optimal
## Hệ thống Tệp (File Systems)
### Phân vùng & Cấu trúc Inode
### Quản lý không gian đĩa rảnh (Free Space Management)
"""
        # 1. Parse lecture note and save
        gen_res = await client.post("/api/mindmap/generate", json={
            "text": lecture_note,
            "title": "Hệ Điều Hành Đại Cương",
            "save": True
        })
        assert gen_res.status_code == 200
        data = gen_res.json()
        assert data["saved"] is True
        mm_id = data["id"]
        root = data["root_node"]

        # Verify 3 main chapters: Process, Memory, File Systems
        assert len(root["children"]) == 3
        process_ch = root["children"][0]
        assert "Quản lý Tiến trình" in process_ch["text"]
        assert len(process_ch["children"]) == 3

        memory_ch = root["children"][1]
        assert "Quản lý Bộ nhớ" in memory_ch["text"]
        assert len(memory_ch["children"]) == 3

        # 2. Export flashcards for exam review
        export_res = await client.post(f"/api/mindmap/{mm_id}/export-flashcards", json={"deck_name": deck_name})
        assert export_res.status_code == 200
        assert export_res.json()["exported_count"] >= 3

        # 3. Verify in flashcards table
        fc_res = await client.get(f"/api/tools/flashcards?deck_name={deck_name}")
        assert fc_res.status_code == 200
        assert len(fc_res.json()) >= 3


@pytest.mark.anyio
async def test_tier4_scenario_medical_pharmacology_taxonomy():
    """Tier 4 Real-World Scenario 2: Medical Pharmacology Taxonomy classification.
    Tests deep classification of antibiotics into drug classes, generations, and clinical indications.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        taxonomy_text = """
# Dược Lý Học: Kháng Sinh Trọng Tâm
## Nhóm Beta-lactam
### Phân nhóm Penicillin
- Penicillin G (tiêm tĩnh mạch)
- Amoxicillin (phổ rộng, uống)
### Phân nhóm Cephalosporin
- Thế hệ 1: Cefazolin, Cephalexin
- Thế hệ 2: Cefuroxime
- Thế hệ 3: Ceftriaxone, Cefotaxime
## Nhóm Macrolide
### Azithromycin (T1/2 dài, nhiễm khuẩn hô hấp)
### Clarithromycin (phác đồ diệt vi khuẩn HP dạ dày)
## Nhóm Quinolone
### Ciprofloxacin (nhiễm khuẩn tiết niệu)
### Levofloxacin (viêm phổi cộng đồng)
"""
        res = await client.post("/api/mindmap/generate", json={
            "text": taxonomy_text,
            "title": "Phân Loại Dược Lý Kháng Sinh",
            "save": True
        })
        assert res.status_code == 200
        mindmap = res.json()
        root = mindmap["root_node"]
        assert len(root["children"]) == 3  # Beta-lactam, Macrolide, Quinolone

        beta_lactam = root["children"][0]
        assert len(beta_lactam["children"]) == 2  # Penicillin, Cephalosporin
        ceph = beta_lactam["children"][1]
        assert len(ceph["children"]) == 3  # Gen 1, Gen 2, Gen 3

        # Check total nodes in medical tree
        assert mindmap["node_count"] >= 14


@pytest.mark.anyio
async def test_tier4_scenario_coding_roadmap_fullstack():
    """Tier 4 Real-World Scenario 3: Fullstack Web Developer 2026 Roadmap.
    Tests broad tree with multi-level technical competencies, tags, and notes persistence.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        roadmap_text = """
# Lộ Trình Fullstack Web Developer 2026
## 1. Nền Tảng Frontend
- HTML5, CSS3 Semantic & Responsive
- JavaScript ESNext & TypeScript
- React 18, React Router & Hooks
- Tailwind CSS & Animation (GSAP, Framer Motion)
## 2. Nền Tảng Backend
- Python FastAPI & AsyncIO
- Kiến trúc RESTful & WebSocket
- Cơ sở dữ liệu SQLite & PostgreSQL
- Quản lý phiên Authentication (JWT, OAuth2)
## 3. DevOps & Triển Khai
- Docker Containerization
- Git Workflows & GitHub Actions
- Nginx Reverse Proxy & SSL Let's Encrypt
"""
        res = await client.post("/api/mindmap/generate", json={
            "text": roadmap_text,
            "title": "Fullstack Roadmap 2026",
            "save": True
        })
        assert res.status_code == 200
        data = res.json()
        assert data["saved"] is True
        root = data["root_node"]
        assert len(root["children"]) == 3
        frontend = root["children"][0]
        assert len(frontend["children"]) == 4
        backend = root["children"][1]
        assert len(backend["children"]) == 4
        devops = root["children"][2]
        assert len(devops["children"]) == 3
