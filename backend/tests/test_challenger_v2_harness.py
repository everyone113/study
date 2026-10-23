import pytest
from app.services.mindmap_generator import (
    parse_text_to_hierarchy,
    generate_mindmap_tree,
    count_tree_nodes,
    clean_text_line
)

# ==============================================================================
# CHALLENGER V2 HARNESS: DEFECT 1 EMPIRICAL VERIFICATION & STRESS TESTING
# ==============================================================================

def test_defect1_hierarchical_numbering_all_variants():
    """
    Empirically test various hierarchical numbering formats:
    - 1.1 Item (no trailing dot)
    - 1.1. Item (with trailing dot)
    - 1.1) Item (with parenthesis)
    - 1.1.1 Item
    - 1.1.1.1 Item
    - 2.1 Item
    - 10.25.100 Item
    Verify:
    1. Prefix is completely stripped
    2. Hierarchy level is accurately determined by dot count
    3. Proper parent-child nesting in generated tree
    """
    text = """
1. Chương 1: Giới thiệu
1.1 Khái niệm cơ bản
1.1.1 Chi tiết khái niệm A
1.1.2 Chi tiết khái niệm B
1.2 Ứng dụng thực tế
1.2.1 Ứng dụng công nghiệp
1.2.1.1 Case study nhà máy
2. Chương 2: Phương pháp luận
2.1 Thu thập số liệu
2.2) Phân tích định lượng
2.2.1. Đánh giá sai số
3. Chương 3: Kết luận
"""
    items = parse_text_to_hierarchy(text)

    # 1. Verify no prefixes leaked into content
    for lvl, content in items:
        assert not content.startswith("1."), f"Prefix leaked: {content}"
        assert not content.startswith("2."), f"Prefix leaked: {content}"
        assert not content.startswith("3."), f"Prefix leaked: {content}"

    # 2. Verify levels
    item_dict = {txt: lvl for lvl, txt in items}
    assert item_dict["Chương 1: Giới thiệu"] == 0
    assert item_dict["Khái niệm cơ bản"] == 1
    assert item_dict["Chi tiết khái niệm A"] == 2
    assert item_dict["Chi tiết khái niệm B"] == 2
    assert item_dict["Ứng dụng thực tế"] == 1
    assert item_dict["Ứng dụng công nghiệp"] == 2
    assert item_dict["Case study nhà máy"] == 3
    assert item_dict["Chương 2: Phương pháp luận"] == 0
    assert item_dict["Thu thập số liệu"] == 1
    assert item_dict["Phân tích định lượng"] == 1
    assert item_dict["Đánh giá sai số"] == 2
    assert item_dict["Chương 3: Kết luận"] == 0

    # 3. Verify tree structure
    tree = generate_mindmap_tree(text, title="Giáo Trình Chuẩn")
    assert tree["text"] == "Giáo Trình Chuẩn"
    # Root should have 3 chapters
    assert len(tree["children"]) == 3
    ch1, ch2, ch3 = tree["children"]
    assert ch1["text"] == "Chương 1: Giới thiệu"
    assert ch2["text"] == "Chương 2: Phương pháp luận"
    assert ch3["text"] == "Chương 3: Kết luận"

    # Ch1 has 2 subnodes: 1.1 and 1.2
    assert len(ch1["children"]) == 2
    sec1_1, sec1_2 = ch1["children"]
    assert sec1_1["text"] == "Khái niệm cơ bản"
    assert len(sec1_1["children"]) == 2
    assert sec1_1["children"][0]["text"] == "Chi tiết khái niệm A"
    assert sec1_1["children"][1]["text"] == "Chi tiết khái niệm B"

    assert sec1_2["text"] == "Ứng dụng thực tế"
    assert len(sec1_2["children"]) == 1
    sec1_2_1 = sec1_2["children"][0]
    assert sec1_2_1["text"] == "Ứng dụng công nghiệp"
    assert len(sec1_2_1["children"]) == 1
    assert sec1_2_1["children"][0]["text"] == "Case study nhà máy"

    # Ch2 has 2 subnodes: 2.1 and 2.2)
    assert len(ch2["children"]) == 2
    assert ch2["children"][0]["text"] == "Thu thập số liệu"
    assert ch2["children"][1]["text"] == "Phân tích định lượng"
    assert len(ch2["children"][1]["children"]) == 1
    assert ch2["children"][1]["children"][0]["text"] == "Đánh giá sai số"


def test_defect1_false_positive_prevention():
    """Verify standard prose starting with a single number (e.g. '1 quả táo', '100 lý do') is NOT misidentified as numbered list."""
    prose = """
- Giỏ trái cây
  1 quả cam thơm ngon
  2 quả táo đỏ
  3 ngày nữa sẽ chín
"""
    items = parse_text_to_hierarchy(prose)
    # The plain text lines should not strip '1' or '2' or '3' because there's no dot/paren
    contents = [c for _, c in items]
    assert "1 quả cam thơm ngon" in contents
    assert "2 quả táo đỏ" in contents
    assert "3 ngày nữa sẽ chín" in contents


# ==============================================================================
# CHALLENGER V2 HARNESS: DEFECT 2 EMPIRICAL VERIFICATION & REGRESSION PREVENTION
# ==============================================================================

def test_defect2_single_bullet_outline_with_explicit_title():
    """Verify single-root bullet outline preserves the root node when explicit title is given."""
    text = """
- Chủ đề cốt lõi duy nhất
  - Nhánh phụ 1
  - Nhánh phụ 2
"""
    tree = generate_mindmap_tree(text, title="Tiêu Đề Người Dùng Đặt")
    assert tree["text"] == "Tiêu Đề Người Dùng Đặt"
    assert len(tree["children"]) == 1
    core_node = tree["children"][0]
    assert core_node["text"] == "Chủ đề cốt lõi duy nhất"
    assert len(core_node["children"]) == 2
    assert core_node["children"][0]["text"] == "Nhánh phụ 1"
    assert core_node["children"][1]["text"] == "Nhánh phụ 2"


def test_defect2_single_bullet_outline_without_explicit_title():
    """Verify single-root bullet outline naturally adopts the lone node as root when NO title is given."""
    text = """
- Chủ đề tự nhiên
  - Nhánh con 1
  - Nhánh con 2
"""
    tree = generate_mindmap_tree(text, title=None)
    assert tree["text"] == "Chủ đề tự nhiên"
    assert len(tree["children"]) == 2
    assert tree["children"][0]["text"] == "Nhánh con 1"
    assert tree["children"][1]["text"] == "Nhánh con 2"


def test_defect2_single_numbered_outline_with_explicit_title():
    """Verify single numbered outline node (1. Section) is preserved under explicit title."""
    text = """
1. Phần mở đầu
1.1 Bối cảnh
1.2 Động lực
"""
    tree = generate_mindmap_tree(text, title="Tài Liệu Tổng Thể")
    assert tree["text"] == "Tài Liệu Tổng Thể"
    assert len(tree["children"]) == 1
    intro_node = tree["children"][0]
    assert intro_node["text"] == "Phần mở đầu"
    assert len(intro_node["children"]) == 2
    assert intro_node["children"][0]["text"] == "Bối cảnh"
    assert intro_node["children"][1]["text"] == "Động lực"


def test_defect2_markdown_h1_with_explicit_title_preserves_semantics():
    """
    Verify Markdown document with single # H1 correctly uses the explicit title
    as root, replacing the # H1 title, while keeping ## H2 as direct children.
    """
    md = """
# Tiêu Đề Tài Liệu Cũ
## Chương 1
- Bài 1
## Chương 2
- Bài 2
"""
    tree = generate_mindmap_tree(md, title="Tiêu Đề Tài Liệu Mới")
    assert tree["text"] == "Tiêu Đề Tài Liệu Mới"
    assert len(tree["children"]) == 2
    assert tree["children"][0]["text"] == "Chương 1"
    assert tree["children"][1]["text"] == "Chương 2"


def test_defect2_markdown_h1_without_explicit_title():
    """Verify Markdown document with single # H1 adopts H1 as root when title is None."""
    md = """
# Trí Tuệ Nhân Tạo
## Học Máy
## Học Sâu
"""
    tree = generate_mindmap_tree(md, title=None)
    assert tree["text"] == "Trí Tuệ Nhân Tạo"
    assert len(tree["children"]) == 2
    assert tree["children"][0]["text"] == "Học Máy"
    assert tree["children"][1]["text"] == "Học Sâu"


def test_defect2_markdown_multiple_h1_with_explicit_title():
    """Verify Markdown with multiple # H1 preserves all H1 as root children."""
    md = """
# Quyển 1: Đại số
## Nhóm
# Quyển 2: Hình học
## Tô pô
"""
    tree = generate_mindmap_tree(md, title="Toán Học Cao Cấp")
    assert tree["text"] == "Toán Học Cao Cấp"
    assert len(tree["children"]) == 2
    assert tree["children"][0]["text"] == "Quyển 1: Đại số"
    assert tree["children"][1]["text"] == "Quyển 2: Hình học"


# ==============================================================================
# CHALLENGER V2 HARNESS: EXTREME ADVERSARIAL STRESS TEST
# ==============================================================================

def test_adversarial_deep_hierarchy_and_number_interleaving():
    """
    Test chaotic interleaving of numbered hierarchy, bullet sub-items,
    and plain text lines with varying indents.
    """
    complex_text = """
1. Khối 1: Kỹ thuật số
1.1 Cổng logic cơ bản
    - Cổng AND: Phép nhân logic
    - Cổng OR: Phép cộng logic
    - Cổng NOT: Phép đảo bit
1.2 Mạch tổ hợp
1.2.1 Bộ cộng bán phần (Half Adder)
      * Sơ đồ chân
      * Bảng chân trị
1.2.2 Bộ giải mã (Decoder)
      * 2-to-4 Decoder
        • Active LOW output
        • Enable pin
2. Khối 2: Vi điều khiển
2.1 Kiến trúc ARM Cortex-M
2.1.1 Thanh ghi điều khiển
2.2 Giao tiếp ngoại vi
2.2.1 UART / USART
2.2.2 SPI Bus
2.2.3 I2C Bus
"""
    tree = generate_mindmap_tree(complex_text, title="Hệ Thống Nhúng")
    assert tree["text"] == "Hệ Thống Nhúng"
    assert len(tree["children"]) == 2
    assert count_tree_nodes(tree) >= 19

    # Verify colors
    palette_colors = set(c["color"] for c in tree["children"])
    assert len(palette_colors) == 2  # Each top branch gets distinct color
