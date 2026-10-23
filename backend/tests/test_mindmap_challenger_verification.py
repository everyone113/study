"""
Adversarial Empirical Verification Test Suite for Milestone 1 (Challenger 2)
Focus Areas:
1. Full CRUD lifecycle with updated_at timestamp delta verification (across second boundary).
2. Direct SQLite physical file inspection on Drive D: (backend/data/studymedia.db) for mindmaps and flashcards.
3. Flashcard extraction integrity: verify rows are truly in the flashcards table with correct schema.
4. Concurrency stress testing: concurrent creates, reads, updates, deletes, and concurrent updates to the same ID.
5. Non-existent ID handling and SQL injection resilience.
6. Transactional safety and validation error boundaries.
"""

import asyncio
import uuid
import sqlite3
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db
from app.config import DATABASE_PATH


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


# ==============================================================================
# 1. FULL CRUD LIFECYCLE & TIMESTAMP DELTA VERIFICATION
# ==============================================================================

@pytest.mark.anyio
async def test_crud_lifecycle_with_updated_at_advancement():
    """Verify create -> read -> update -> verify updated_at > created_at -> delete -> verify 404 and SQLite row removal."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create Mindmap
        create_payload = {
            "title": "Challenger Lifecycle Test Mindmap",
            "description": "Initial description before update",
            "tags": "Lifecycle,Adversarial",
            "user_id": "challenger_user_01",
            "root_node": {
                "id": "node-root-01",
                "text": "Challenger Lifecycle Root",
                "color": "#6366f1",
                "isCollapsed": False,
                "notes": "Testing timestamp semantics",
                "children": [
                    {"id": "node-sub-1", "text": "Sub 1", "color": "#3b82f6", "children": []}
                ]
            }
        }
        res_create = await client.post("/api/mindmap", json=create_payload)
        assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.text}"
        created = res_create.json()
        mm_id = created["id"]
        assert mm_id.startswith("mm_")
        assert created["title"] == "Challenger Lifecycle Test Mindmap"
        assert created["node_count"] == 2
        created_at_str = created["created_at"]
        initial_updated_at_str = created["updated_at"]
        assert created_at_str != "", "created_at must not be empty"

        # 2. Read back via GET
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["id"] == mm_id
        assert fetched["title"] == "Challenger Lifecycle Test Mindmap"
        assert fetched["description"] == "Initial description before update"
        assert fetched["tags"] == "Lifecycle,Adversarial"
        assert fetched["root_node"]["id"] == "node-root-01"
        assert fetched["root_data"]["id"] == "node-root-01"

        # 3. Wait 1.1s to cross SQLite second boundary for datetime('now')
        await asyncio.sleep(1.1)

        # 4. Update title, tags, description, and root_node
        updated_tree = {
            "id": "node-root-01",
            "text": "Challenger Lifecycle Root (MODIFIED)",
            "color": "#10b981",
            "isCollapsed": True,
            "children": [
                {"id": "node-sub-1", "text": "Sub 1 Modified", "color": "#10b981", "children": []},
                {"id": "node-sub-2", "text": "Sub 2 Added", "color": "#10b981", "children": []}
            ]
        }
        update_payload = {
            "title": "Challenger Lifecycle Test Mindmap - Updated",
            "description": "Updated description after modification",
            "tags": "Lifecycle,Updated,Verified",
            "root_node": updated_tree
        }
        res_update = await client.put(f"/api/mindmap/{mm_id}", json=update_payload)
        assert res_update.status_code == 200, f"Expected 200, got {res_update.status_code}: {res_update.text}"
        updated = res_update.json()

        assert updated["title"] == "Challenger Lifecycle Test Mindmap - Updated"
        assert updated["description"] == "Updated description after modification"
        assert updated["tags"] == "Lifecycle,Updated,Verified"
        assert updated["node_count"] == 3
        assert updated["root_node"]["text"] == "Challenger Lifecycle Root (MODIFIED)"
        assert updated["root_data"]["text"] == "Challenger Lifecycle Root (MODIFIED)"

        new_updated_at_str = updated["updated_at"]
        assert new_updated_at_str > initial_updated_at_str, (
            f"updated_at must advance after modification! Before: {initial_updated_at_str}, After: {new_updated_at_str}"
        )

        # 5. Verify direct physical SQLite persistence before deletion
        con = sqlite3.connect(DATABASE_PATH)
        cur = con.cursor()
        row = cur.execute("SELECT id, title, tags, updated_at FROM mindmaps WHERE id = ?", (mm_id,)).fetchone()
        assert row is not None, "Row must exist in SQLite database file"
        assert row[1] == "Challenger Lifecycle Test Mindmap - Updated"
        assert row[2] == "Lifecycle,Updated,Verified"
        con.close()

        # 6. Delete mindmap
        res_delete = await client.delete(f"/api/mindmap/{mm_id}")
        assert res_delete.status_code == 200
        assert res_delete.json()["status"] == "ok"

        # 7. Verify API returns 404 for deleted mindmap
        res_get_deleted = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get_deleted.status_code == 404

        # 8. Verify direct physical SQLite deletion
        con = sqlite3.connect(DATABASE_PATH)
        cur = con.cursor()
        row_deleted = cur.execute("SELECT id FROM mindmaps WHERE id = ?", (mm_id,)).fetchone()
        con.close()
        assert row_deleted is None, "Mindmap row must be completely removed from SQLite database"


# ==============================================================================
# 2. FLASHCARD PERSISTENCE INTEGRITY ON DRIVE D:
# ==============================================================================

@pytest.mark.anyio
async def test_flashcard_export_direct_sqlite_table_verification():
    """Verify that export-flashcards physically inserts rows into the 'flashcards' SQLite table on Drive D:."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_tag = f"ChallengerDeck_{uuid.uuid4().hex[:8]}"

        # 1. Create Mindmap with rich hierarchy
        tree = {
            "id": "root-cs",
            "text": "Khoa học Máy tính",
            "color": "#6366f1",
            "children": [
                {
                    "id": "br-1",
                    "text": "Cơ sở dữ liệu",
                    "notes": "Hệ thống lưu trữ và truy vấn thông tin",
                    "children": [
                        {"id": "leaf-1", "text": "ACID Properties", "notes": "Atomicity, Consistency, Isolation, Durability", "children": []},
                        {"id": "leaf-2", "text": "Index B-Tree", "notes": "Tối ưu hóa tốc độ tìm kiếm O(log N)", "children": []}
                    ]
                },
                {
                    "id": "br-2",
                    "text": "Mạng máy tính",
                    "notes": "Giao thức truyền thông giữa các máy chủ",
                    "children": [
                        {"id": "leaf-3", "text": "TCP 3-Way Handshake", "notes": "SYN, SYN-ACK, ACK", "children": []}
                    ]
                }
            ]
        }
        res_create = await client.post("/api/mindmap", json={
            "title": "Khoa học máy tính Flashcards Source",
            "root_node": tree
        })
        assert res_create.status_code == 201
        mm_id = res_create.json()["id"]

        # 2. Call export-flashcards endpoint
        res_export = await client.post(f"/api/mindmap/{mm_id}/export-flashcards", json={
            "deck_name": deck_tag
        })
        assert res_export.status_code == 200
        export_data = res_export.json()
        assert export_data["status"] == "ok"
        exported_count = export_data["exported_count"]
        assert exported_count >= 2, f"Expected at least 2 cards extracted, got {exported_count}"

        # 3. DIRECT RAW SQLITE VERIFICATION ON DRIVE D:
        # Check actual database file studymedia.db without using FastAPI router
        con = sqlite3.connect(DATABASE_PATH)
        cur = con.cursor()
        rows = cur.execute(
            "SELECT id, deck_name, front, back, box, next_review, created_at FROM flashcards WHERE deck_name = ?",
            (deck_tag,)
        ).fetchall()
        con.close()

        assert len(rows) == exported_count, f"SQLite row count ({len(rows)}) must match exported_count ({exported_count})"

        # Verify column content
        for r in rows:
            card_id, d_name, front, back, box, next_review, created_at = r
            assert isinstance(card_id, int)
            assert d_name == deck_tag
            assert front and len(front.strip()) > 0
            assert back and len(back.strip()) > 0
            assert box == 1
            assert next_review is not None
            assert created_at is not None

        # Verify flashcard content mentions extracted concepts
        all_fronts = " ".join(r[2] for r in rows)
        all_backs = " ".join(r[3] for r in rows)
        assert "Khoa học Máy tính" in all_fronts or "Cơ sở dữ liệu" in all_fronts or "Mạng máy tính" in all_fronts

        # 4. Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")
        con = sqlite3.connect(DATABASE_PATH)
        con.execute("DELETE FROM flashcards WHERE deck_name = ?", (deck_tag,))
        con.commit()
        con.close()


@pytest.mark.anyio
async def test_custom_flashcards_export_direct_sqlite_verification():
    """Verify custom flashcard export inserts exact arbitrary front/back text directly into SQLite."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        deck_tag = f"CustomDeck_{uuid.uuid4().hex[:8]}"
        cards_payload = [
            {"front": "Thuật toán A* là gì?", "back": "Giải thuật tìm đường đi ngắn nhất sử dụng hàm heuristic f(n) = g(n) + h(n)."},
            {"front": "Độ phức tạp Mergesort?", "back": "Luôn luôn là O(N log N) trong mọi trường hợp tốt/xấu/trung bình."},
            {"front": "CAP Theorem gồm những gì?", "back": "Consistency, Availability, Partition Tolerance - hệ phân tán chỉ thỏa mãn tối đa 2/3."}
        ]
        res = await client.post("/api/mindmap/export-flashcards", json={
            "deck_name": deck_tag,
            "cards": cards_payload
        })
        assert res.status_code == 200
        assert res.json()["exported_count"] == 3

        # Direct SQLite verification
        con = sqlite3.connect(DATABASE_PATH)
        cur = con.cursor()
        rows = cur.execute(
            "SELECT front, back FROM flashcards WHERE deck_name = ? ORDER BY id ASC",
            (deck_tag,)
        ).fetchall()
        con.close()

        assert len(rows) == 3
        assert rows[0][0] == "Thuật toán A* là gì?"
        assert "heuristic" in rows[0][1]
        assert rows[1][0] == "Độ phức tạp Mergesort?"
        assert rows[2][0] == "CAP Theorem gồm những gì?"

        # Cleanup
        con = sqlite3.connect(DATABASE_PATH)
        con.execute("DELETE FROM flashcards WHERE deck_name = ?", (deck_tag,))
        con.commit()
        con.close()


# ==============================================================================
# 3. CONCURRENCY & TRANSACTIONAL STRESS TESTING
# ==============================================================================

@pytest.mark.anyio
async def test_concurrency_30_parallel_creates_and_reads():
    """Verify 30 concurrent mindmap creation requests do not lock SQLite or lose data."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tag_batch = f"BatchConcurrency_{uuid.uuid4().hex[:6]}"

        async def create_worker(index: int):
            payload = {
                "title": f"Concurrent Map #{index}",
                "description": f"Testing parallel SQLite inserts from worker {index}",
                "tags": tag_batch,
                "user_id": f"worker_{index}"
            }
            res = await client.post("/api/mindmap", json=payload)
            assert res.status_code == 201, f"Worker {index} failed: {res.text}"
            return res.json()["id"]

        # 30 simultaneous inserts
        tasks = [create_worker(i) for i in range(30)]
        created_ids = await asyncio.gather(*tasks)

        assert len(created_ids) == 30
        assert len(set(created_ids)) == 30, "All 30 IDs must be uniquely generated"

        # 30 simultaneous reads
        async def read_worker(mid: str):
            res = await client.get(f"/api/mindmap/{mid}")
            assert res.status_code == 200
            return res.json()["id"]

        read_tasks = [read_worker(mid) for mid in created_ids]
        read_ids = await asyncio.gather(*read_tasks)
        assert len(read_ids) == 30

        # Query batch via search
        res_search = await client.get(f"/api/mindmap?search={tag_batch}")
        assert res_search.status_code == 200
        assert len(res_search.json()) == 30

        # 30 simultaneous deletes
        async def delete_worker(mid: str):
            res = await client.delete(f"/api/mindmap/{mid}")
            assert res.status_code == 200

        delete_tasks = [delete_worker(mid) for mid in created_ids]
        await asyncio.gather(*delete_tasks)

        # Confirm all are deleted
        res_search_after = await client.get(f"/api/mindmap?search={tag_batch}")
        assert len(res_search_after.json()) == 0


@pytest.mark.anyio
async def test_concurrency_race_condition_updates_on_same_mindmap():
    """Verify multiple concurrent updates on the same mindmap row resolve safely without DB deadlock."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create base map
        res_create = await client.post("/api/mindmap", json={"title": "Original Title"})
        assert res_create.status_code == 201
        mm_id = res_create.json()["id"]

        # Launch 15 concurrent updates on the same ID
        async def update_worker(index: int):
            payload = {
                "title": f"Updated Title By Worker {index}",
                "description": f"Worker {index} modification"
            }
            res = await client.put(f"/api/mindmap/{mm_id}", json=payload)
            assert res.status_code == 200
            return res.json()["title"]

        tasks = [update_worker(i) for i in range(15)]
        results = await asyncio.gather(*tasks)
        assert len(results) == 15

        # Final state check
        res_final = await client.get(f"/api/mindmap/{mm_id}")
        assert res_final.status_code == 200
        final_title = res_final.json()["title"]
        assert final_title.startswith("Updated Title By Worker ")

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")


# ==============================================================================
# 4. ADVERSARIAL EDGE CASES, NON-EXISTENT IDS & INJECTION RESILIENCE
# ==============================================================================

@pytest.mark.anyio
async def test_nonexistent_and_malformed_id_boundaries():
    """Verify system returns 404 cleanly for all operations on non-existent or adversarial IDs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        adversarial_ids = [
            "mm_nonexistent_12345",
            "nonexistent-without-prefix",
            "mm_' OR '1'='1",
            "mm_../../etc/passwd",
            "mm_<script>alert(1)</script>",
            "mm_" + ("x" * 1000)  # Super long ID
        ]

        for bad_id in adversarial_ids:
            # GET
            res_get = await client.get(f"/api/mindmap/{bad_id}")
            assert res_get.status_code == 404, f"GET {bad_id} returned {res_get.status_code}"

            # PUT
            res_put = await client.put(f"/api/mindmap/{bad_id}", json={"title": "Should fail"})
            assert res_put.status_code == 404, f"PUT {bad_id} returned {res_put.status_code}"

            # DELETE
            res_del = await client.delete(f"/api/mindmap/{bad_id}")
            assert res_del.status_code == 404, f"DELETE {bad_id} returned {res_del.status_code}"

            # Export flashcards
            res_exp = await client.post(f"/api/mindmap/{bad_id}/export-flashcards")
            assert res_exp.status_code == 404, f"Export {bad_id} returned {res_exp.status_code}"


@pytest.mark.anyio
async def test_sql_injection_resilience_in_search():
    """Verify search filter safely parameterizes SQL queries and handles malicious patterns."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        malicious_search_queries = [
            "' OR 1=1 --",
            "'; DROP TABLE mindmaps; --",
            "\" OR \"\"=\"",
            "UNION SELECT * FROM users --",
            "%%%",
            "\\",
            "'\";"
        ]
        for query in malicious_search_queries:
            res = await client.get("/api/mindmap", params={"search": query})
            assert res.status_code == 200, f"Search query '{query}' failed with {res.status_code}: {res.text}"
            assert isinstance(res.json(), list)

        # Verify mindmaps table was not dropped
        con = sqlite3.connect(DATABASE_PATH)
        cur = con.cursor()
        cur.execute("SELECT COUNT(*) FROM mindmaps")
        con.close()


@pytest.mark.anyio
async def test_validation_and_transactional_rollback():
    """Verify that failed updates/creates don't leave dirty data or corrupt rows."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create valid mindmap
        res_create = await client.post("/api/mindmap", json={"title": "Immutable Title Baseline"})
        assert res_create.status_code == 201
        mm_id = res_create.json()["id"]

        # Attempt update with empty whitespace title -> 400
        res_bad_put = await client.put(f"/api/mindmap/{mm_id}", json={"title": "   \n\t  "})
        assert res_bad_put.status_code == 400

        # Verify original title was preserved and not corrupted
        res_check = await client.get(f"/api/mindmap/{mm_id}")
        assert res_check.status_code == 200
        assert res_check.json()["title"] == "Immutable Title Baseline"

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")
