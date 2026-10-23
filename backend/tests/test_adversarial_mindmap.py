import time
import unicodedata
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db
from app.models.mindmap import MindmapNode
from app.services.mindmap_generator import (
    parse_text_to_hierarchy,
    generate_mindmap_tree,
    count_tree_nodes,
    extract_flashcards_from_tree,
    clean_text_line,
)

@pytest.fixture(autouse=True)
async def ensure_db():
    await init_db()

# ==============================================================================
# 1. DEEPLY NESTED OUTLINES (UP TO 30 LEVELS)
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_deep_nesting_30_levels():
    """Verify that outline nesting up to 30 levels is parsed into a valid tree without loss or crash."""
    lines = ["# 30-Level Deep Outline Root"]
    # Indented bullets for levels 1 to 30 (30 nested levels under root)
    for i in range(1, 31):
        indent = "  " * (i - 1)
        lines.append(f"{indent}- Deep Bullet Level {i}")

    deep_text = "\n".join(lines)

    # 1. Direct generator call
    tree = generate_mindmap_tree(deep_text)
    assert tree is not None
    assert tree["text"] == "30-Level Deep Outline Root"

    # Verify depth by traversing down the single deepest branch
    depth = 0
    curr = tree
    while curr.get("children"):
        depth += 1
        curr = curr["children"][0]
    assert depth == 30, f"Expected tree depth == 30, got {depth}"

    # Verify total node count: 1 root + 30 children = 31 nodes
    total_nodes = count_tree_nodes(tree)
    assert total_nodes == 31, f"Expected total nodes == 31, got {total_nodes}"

    # Verify Pydantic validation on 30-level deep tree
    validated = MindmapNode.model_validate(tree)
    assert validated.text == "30-Level Deep Outline Root"

    # 2. Endpoint call with save=True
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/mindmap/generate", json={
            "text": deep_text,
            "title": "30-Level Deep Mindmap API",
            "save": True
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["saved"] is True
        mm_id = data["id"]
        assert data["node_count"] == 31

        # Retrieve saved mindmap
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["node_count"] == 31

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")


@pytest.mark.anyio
async def test_adversarial_deep_numbered_hierarchy_with_trailing_dots_30_levels():
    """Verify that multi-dot numbered hierarchy with trailing dots (1.1.1.) up to 30 dots parses correctly."""
    lines = ["1. Root Level"]
    prefix_parts = ["1"]
    for i in range(2, 31):
        prefix_parts.append("1")
        num_str = ".".join(prefix_parts) + "."
        lines.append(f"{num_str} Numbered Level {i}")

    numbered_text = "\n".join(lines)
    tree = generate_mindmap_tree(numbered_text)
    assert tree is not None
    assert count_tree_nodes(tree) >= 30

    # Verify depth
    depth = 0
    curr = tree
    while curr.get("children"):
        depth += 1
        curr = curr["children"][0]
    assert depth >= 29, f"Expected numbered tree depth >= 29, got {depth}"


@pytest.mark.anyio
async def test_empirical_bug_numbered_hierarchy_without_trailing_dots():
    """
    VERIFIED RESOLUTION:
    Standard section numbering without trailing dots (e.g. '1.1 Title', '1.2 Title')
    is correctly recognized as numbered hierarchy.
    Prefix '1.1' is stripped and the item is nested at level 1 under Chapter 1.
    """
    text = """
1. Chương 1: Cơ sở lý thuyết
1.1 Định nghĩa và khái niệm
1.2 Mục tiêu nghiên cứu
2. Chương 2: Phương pháp thực nghiệm
2.1 Thiết lập môi trường
2.2 Thu thập dữ liệu
"""
    items = parse_text_to_hierarchy(text)
    assert not any("1.1" in txt for _, txt in items), "Prefix '1.1' was not stripped"
    assert any(lvl == 1 and txt == "Định nghĩa và khái niệm" for lvl, txt in items), "1.1 was not assigned to level 1"

    tree = generate_mindmap_tree(text)
    assert len(tree["children"]) == 2, f"Expected 2 chapters as root children, got {len(tree['children'])}"


@pytest.mark.anyio
async def test_oracle_expected_numbered_hierarchy():
    """Oracle test: expects 1.1 and 1.2 to nest under Chapter 1, and 2.1 and 2.2 under Chapter 2."""
    text = """
1. Chương 1: Cơ sở lý thuyết
1.1 Định nghĩa và khái niệm
1.2 Mục tiêu nghiên cứu
2. Chương 2: Phương pháp thực nghiệm
2.1 Thiết lập môi trường
2.2 Thu thập dữ liệu
"""
    tree = generate_mindmap_tree(text)
    # Expected: Root has 2 chapters as children
    assert len(tree["children"]) == 2
    ch1 = tree["children"][0]
    assert "Chương 1" in ch1["text"]
    assert len(ch1["children"]) == 2
    assert ch1["children"][0]["text"] == "Định nghĩa và khái niệm"


@pytest.mark.anyio
async def test_empirical_bug_single_root_node_dropped_when_title_provided():
    """
    VERIFIED RESOLUTION:
    When an outline has a single top-level bullet (e.g. '- Phần 1: Khởi đầu' with sub-bullets),
    and the caller supplies a 'title' parameter (e.g. title='Kế Hoạch Học Tập'),
    the top-level bullet is retained under the title root node without data loss.
    """
    text = """
- Phần 1: Khởi đầu
  - Bài học 1
  - Bài học 2
"""
    tree = generate_mindmap_tree(text, title="Kế Hoạch Học Tập")
    assert tree["text"] == "Kế Hoạch Học Tập"

    all_texts = []
    def collect(n):
        all_texts.append(n["text"])
        for c in n["children"]:
            collect(c)
    collect(tree)

    assert "Phần 1: Khởi đầu" in all_texts, "'Phần 1: Khởi đầu' must be retained in the tree!"


@pytest.mark.anyio
async def test_oracle_expected_no_data_loss_with_title():
    """Oracle test: user's top-level outline item must NOT be dropped when title is supplied."""
    text = """
- Phần 1: Khởi đầu
  - Bài học 1
  - Bài học 2
"""
    tree = generate_mindmap_tree(text, title="Kế Hoạch Học Tập")
    all_texts = []
    def collect(n):
        all_texts.append(n["text"])
        for c in n["children"]:
            collect(c)
    collect(tree)

    # Expected: The user's content 'Phần 1: Khởi đầu' is retained as a branch under the title
    assert "Phần 1: Khởi đầu" in all_texts




# ==============================================================================
# 2. MIXED INDENTATION, TABS, SPACES, BULLET SYMBOLS, AND LEVEL JUMPS
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_mixed_indentation_and_bullet_types():
    """Verify parser robustness against chaotic mixing of tabs, spaces, bullet symbols, and level jumps."""
    chaotic_markdown = """
# Gốc Chủ Đề (Markdown Header)
- Bullet trừ thông thường (2 spaces)
  * Bullet sao (2 spaces indent)
	+ Bullet cộng với tab
		• Bullet chấm tròn với 2 tabs
			– Bullet en-dash với 3 tabs
1. Numbered item 1
   1.1 Numbered sub-item (3 spaces)
     1.1.1 Deeper sub-item (5 spaces)
2) Parenthesis numbered item
                                - Extreme 32-space indentation jump
- Return to base level bullet
	- Mixed tab and spaces
   - 3 spaces indent
     - 5 spaces indent
       - 7 spaces indent
"""
    # 1. Service parser
    parsed_items = parse_text_to_hierarchy(chaotic_markdown)
    assert len(parsed_items) >= 12

    tree = generate_mindmap_tree(chaotic_markdown, title="Chaotic Mindmap")
    assert tree is not None
    assert tree["id"] == "node-root"
    assert len(tree["children"]) >= 2
    assert count_tree_nodes(tree) >= 12

    # Verify no NaN or corrupt objects in tree
    def check_node_integrity(n):
        assert "id" in n and isinstance(n["id"], str)
        assert "text" in n and isinstance(n["text"], str) and len(n["text"]) > 0
        assert "color" in n and isinstance(n["color"], str)
        assert "isCollapsed" in n and isinstance(n["isCollapsed"], bool)
        assert "children" in n and isinstance(n["children"], list)
        for child in n["children"]:
            check_node_integrity(child)

    check_node_integrity(tree)

    # 2. Endpoint validation
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/mindmap/generate", json={
            "text": chaotic_markdown,
            "title": "Chaotic Indentation Test"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["node_count"] == count_tree_nodes(tree)


@pytest.mark.anyio
async def test_adversarial_wild_level_jumps_and_unwinds():
    """Verify that severe level leaps (e.g. level 0 -> 25 -> 2 -> 18 -> 1) maintain tree invariants."""
    wild_text = """
- Level 1 Alpha
                                                  - Level 26 Deep Leap
  - Level 2 Immediate Unwind
                                    - Level 17 Second Leap
    - Level 3 Child of Level 2
- Level 1 Beta
"""
    tree = generate_mindmap_tree(wild_text, title="Wild Leaps")
    assert tree is not None
    # Root should have children Alpha and Beta
    alpha = next((c for c in tree["children"] if "Alpha" in c["text"]), None)
    beta = next((c for c in tree["children"] if "Beta" in c["text"]), None)
    assert alpha is not None
    assert beta is not None
    assert count_tree_nodes(tree) == 7


# ==============================================================================
# 3. EXTREME INPUTS: EMPTY STRINGS, WHITESPACE, GHOST BULLETS, FORMATTING ARTIFACTS
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_empty_and_whitespace_inputs():
    """Verify behavior on empty, whitespace-only, and blank string inputs."""
    # 1. Direct service behavior: should return safe default template
    tree_empty = generate_mindmap_tree("", title="Default on Empty")
    assert tree_empty["id"] == "node-root"
    assert tree_empty["text"] == "Default on Empty"
    assert len(tree_empty["children"]) == 2  # Fallback template has 2 default branches

    tree_whitespace = generate_mindmap_tree("   \n\t\n  \r\n   ", title=None)
    assert tree_whitespace["id"] == "node-root"
    assert tree_whitespace["text"] == "Ý tưởng chính"
    assert len(tree_whitespace["children"]) == 2

    # 2. API Endpoint behavior: should reject pure whitespace with HTTP 400 or 422
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res1 = await client.post("/api/mindmap/generate", json={"text": ""})
        assert res1.status_code in (400, 422)

        res2 = await client.post("/api/mindmap/generate", json={"text": "   \n\t  \r\n   "})
        assert res2.status_code in (400, 422)

        res3 = await client.post("/api/mindmap", json={"title": "   "})
        assert res3.status_code in (400, 422)


@pytest.mark.anyio
async def test_adversarial_ghost_bullets_and_formatting_artifacts():
    """Verify input with empty bullets, raw markdown symbols, and stripped quotes."""
    ghost_text = """
- 
* 
+ 
• 
– 
1. 
2.1. 
### 
***
___
""
''
\"\"\"\"
''''
"Valid Content inside quotes"
**Valid Bold Content**
*Valid Italic Content*
"""
    parsed = parse_text_to_hierarchy(ghost_text)
    # Only non-empty cleaned lines should be captured
    texts = [t for _, t in parsed]
    assert "Valid Content inside quotes" in texts
    assert "Valid Bold Content" in texts
    assert "Valid Italic Content" in texts
    assert "" not in texts

    tree = generate_mindmap_tree(ghost_text)
    assert tree is not None
    # All node texts must be non-empty strings
    def assert_no_empty_text(n):
        assert len(n["text"].strip()) > 0
        for c in n["children"]:
            assert_no_empty_text(c)
    assert_no_empty_text(tree)


# ==============================================================================
# 4. HUGE MARKDOWN TEXT (10,000 LINES)
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_huge_markdown_10000_lines():
    """Verify performance, memory stability, and correctness when parsing 10,000 lines."""
    # Generate 10,000 lines: 100 chapters, each having 10 sections, each having 9 items (100 * 10 * 10 = 10,000 lines)
    lines = []
    for c in range(1, 101):
        lines.append(f"# Chương {c}: Tổng Quan Hệ Thống {c}")
        for s in range(1, 10):
            lines.append(f"## Mục {c}.{s}: Khái niệm cốt lõi")
            for item in range(1, 10):
                lines.append(f"  - Chi tiết {c}.{s}.{item}: Dữ liệu mở rộng")

    # Fill remainder to exactly 10,000 lines
    remaining = 10000 - len(lines)
    for r in range(remaining):
        lines.append(f"  - Phần tử phụ {r + 1}")

    assert len(lines) == 10000
    huge_markdown = "\n".join(lines)

    # Measure parsing and tree construction time
    t0 = time.perf_counter()
    tree = generate_mindmap_tree(huge_markdown, title="Sơ Đồ Quy Mô Khủng (10.000 Dòng)")
    t1 = time.perf_counter()

    elapsed = t1 - t0
    # Must complete within 5 seconds on modern CPU
    assert elapsed < 5.0, f"Parsing 10,000 lines took too long: {elapsed:.3f}s"

    # Count nodes
    total_nodes = count_tree_nodes(tree)
    # The root + 10,000 parsed lines
    assert total_nodes >= 9900, f"Expected total nodes ~10,000, got {total_nodes}"

    # Verify root has expected branches
    assert len(tree["children"]) >= 100

    # Verify JSON serialization does not fail on huge tree
    import json
    json_str = json.dumps(tree, ensure_ascii=False)
    assert len(json_str) > 1_000_000  # Over 1MB of JSON tree data


# ==============================================================================
# 5. COMPLEX VIETNAMESE UNICODE, DIACRITICS, COMBINING MARKS & MULTILINGUAL
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_vietnamese_unicode_and_combining_diacritics():
    """Verify complete Vietnamese tone preservation, NFD/NFC decomposition, and international characters."""
    # Vietnamese pangrams and tone stress tests
    vn_text = """
# Tiếng Việt Toàn Vẹn: Độc Lập - Tự Do - Hạnh Phúc
- Bách khoa toàn thư mở Wikipedia Tiếng Việt
  - Đường đời đứt đoạn, đừng đau đớn
  - Quả ớt đỏ ửng, củ cải trắng muốt
  - Bảy kỳ quan thế giới cổ đại & hiện đại
- Kiểm tra các nguyên âm ghép có dấu phức tạp:
  - Ă Ằ Ắ Ẳ Ẵ Ặ (Á Ă Â)
  - Ê Ề Ế Ể Ễ Ệ
  - Ô Ồ Ố Ổ Ỗ Ộ
  - Ơ Ờ Ớ Ở Ỡ Ợ
  - Ư Ừ Ứ Ử Ữ Ự
  - Ý Ỳ Ỷ Ỹ Ỵ
- Multilingual & Symbols:
  - Kanji / Hán tự: 知識圖譜 (Knowledge Graph), 人工智能 (AI)
  - Japanese Kana: マインドマップ (Mindmap), ひらがな
  - Russian Cyrillic: База знаний и нейросети
  - Math & Logic: ∀x ∈ ℝ, ∃y : f(x) ≤ ∫[0,∞] e^(-t) dt ≠ 0
  - Emojis: 🚀 Trí tuệ nhân tạo 🧠 Bản đồ tư duy 💡 Sáng tạo ⚡
"""
    # Test decomposed NFD form
    nfd_text = unicodedata.normalize('NFD', vn_text)
    tree_nfd = generate_mindmap_tree(nfd_text, title="NFD Vietnamese Tree")
    assert tree_nfd is not None
    assert count_tree_nodes(tree_nfd) >= 15

    # Test composed NFC form
    nfc_text = unicodedata.normalize('NFC', vn_text)
    tree_nfc = generate_mindmap_tree(nfc_text, title="NFC Vietnamese Tree")
    assert tree_nfc is not None
    assert count_tree_nodes(tree_nfc) >= 15

    # Check that diacritics are preserved and not corrupted to '?' or broken encodings
    all_texts = []
    def collect_texts(node):
        all_texts.append(node["text"])
        for c in node.get("children", []):
            collect_texts(c)
    collect_texts(tree_nfc)
    joined = " ".join(all_texts)

    assert "Đường đời đứt đoạn" in joined
    assert "Quả ớt đỏ ửng" in joined
    assert "知識圖譜" in joined
    assert "マインドマップ" in joined
    assert "Нейросети" in joined or "нейросети" in joined
    assert "🧠" in joined
    assert "∀x ∈ ℝ" in joined


@pytest.mark.anyio
async def test_adversarial_zero_width_and_invisible_unicode():
    """Verify invisible unicode chars (zero-width space, non-breaking space, BOM) do not crash parser."""
    text_with_invisibles = (
        "\uFEFF# Header with BOM\n"
        "- Item\u200Bwith\u200Bzero\u200Bwidth\u200Bspace\n"
        "- Item\u00A0with\u00A0non\u00A0breaking\u00A0space\n"
        "- \u200B\u200B\u200B\n"  # Only zero-width spaces
    )
    tree = generate_mindmap_tree(text_with_invisibles)
    assert tree is not None
    assert count_tree_nodes(tree) >= 3


# ==============================================================================
# 6. SCRIPT INJECTION PAYLOADS, XSS & SQL INJECTION ROBUSTNESS
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_script_injection_and_xss_payloads():
    """Verify that XSS / HTML / Script injection payloads are safely stored as pure text."""
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('img-xss')>",
        "javascript:alert(document.domain)",
        "\"><svg onload=alert(1)>",
        "<iframe src='javascript:alert(1)'></iframe>",
        "{{ 7 * 7 }}",
        "${7 * 7}",
        "<!--#exec cmd=\"ls\"-->"
    ]

    outline = "# XSS Security Test Suite\n" + "\n".join(f"- {p}" for p in xss_payloads)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Generate with save=True
        res = await client.post("/api/mindmap/generate", json={
            "text": outline,
            "title": "<script>alert('Title XSS')</script>",
            "save": True
        })
        assert res.status_code == 200
        data = res.json()
        mm_id = data["id"]

        # Retrieve saved mindmap
        res_get = await client.get(f"/api/mindmap/{mm_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()

        # Verify title is stored safely as raw text without unescaped execution or corruption
        assert fetched["title"] == "<script>alert('Title XSS')</script>"

        # Verify child nodes preserve strings intact
        children_texts = [c["text"] for c in fetched["root_node"]["children"]]
        for p in xss_payloads:
            assert p in children_texts

        # Cleanup
        await client.delete(f"/api/mindmap/{mm_id}")


@pytest.mark.anyio
async def test_adversarial_sql_injection_attempts():
    """Verify that SQL injection payloads in title, search, user_id, and ID do not violate database integrity."""
    sqli_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE mindmaps; --",
        "' UNION SELECT null, null, null, null, null, null, null, null --",
        "1; WAITFOR DELAY '0:0:5'--",
        "admin'--",
        "' OR 1=1#"
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for sqli in sqli_payloads:
            # 1. SQLi in search query
            res_search = await client.get(f"/api/mindmap?search={sqli}")
            assert res_search.status_code == 200
            assert isinstance(res_search.json(), list)

            # 2. SQLi in user_id query
            res_user = await client.get(f"/api/mindmap?user_id={sqli}")
            assert res_user.status_code == 200
            assert isinstance(res_user.json(), list)

            # 3. SQLi in ID parameter
            res_id = await client.get(f"/api/mindmap/{sqli}")
            assert res_id.status_code == 404

            # 4. Create with SQLi in title and user_id
            res_create = await client.post("/api/mindmap", json={
                "title": f"SQLi Title {sqli}",
                "user_id": sqli,
                "description": sqli
            })
            assert res_create.status_code == 201
            created = res_create.json()
            mm_id = created["id"]

            # Ensure table mindmaps was not dropped and still works
            res_check = await client.get(f"/api/mindmap/{mm_id}")
            assert res_check.status_code == 200

            # Cleanup
            await client.delete(f"/api/mindmap/{mm_id}")


# ==============================================================================
# 7. FLASHCARD EXTRACTION EDGE CASES
# ==============================================================================

@pytest.mark.anyio
async def test_adversarial_flashcard_extraction_extremes():
    """Verify flashcard extraction from degenerate trees (single root, empty notes, deep branches)."""
    # Case 1: Single root node with no children and no notes
    single_root = {
        "id": "root",
        "text": "Khái Niệm Cô Đơn",
        "color": "#6366f1",
        "isCollapsed": False,
        "notes": "",
        "children": []
    }
    cards = extract_flashcards_from_tree(single_root, "Test Deck")
    assert len(cards) == 1
    assert cards[0]["front"] == "Khái Niệm Cô Đơn"

    # Case 2: Tree with empty strings in children
    root_with_empty_children = {
        "id": "root",
        "text": "Câu hỏi tổng quát",
        "children": [
            {"id": "c1", "text": "   ", "children": []},
            {"id": "c2", "text": "Ý đúng thứ nhất", "children": []},
            {"id": "c3", "text": "", "children": []}
        ]
    }
    cards2 = extract_flashcards_from_tree(root_with_empty_children, "Test Deck 2")
    assert len(cards2) == 1
    assert "Ý đúng thứ nhất" in cards2[0]["back"]
