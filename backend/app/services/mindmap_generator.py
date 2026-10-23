import re
import uuid
from typing import Dict, Any, List, Optional, Tuple

PALETTE = [
    "#3b82f6",  # Blue
    "#10b981",  # Emerald
    "#f59e0b",  # Amber
    "#8b5cf6",  # Purple
    "#ec4899",  # Pink
    "#06b6d4",  # Cyan
    "#f97316",  # Orange
    "#14b8a6",  # Teal
]

ROOT_COLOR = "#6366f1"  # Indigo

def clean_text_line(text: str) -> str:
    """Strip markdown formatting like bold/italics, quotes, bullet markers."""
    t = text.strip()
    # Strip markdown bold/italic
    t = re.sub(r'^\*{1,3}(.*?)\*{1,3}$', r'\1', t)
    t = re.sub(r'^_{1,3}(.*?)_{1,3}$', r'\1', t)
    # Strip leading quotes
    if (t.startswith('"') and t.endswith('"')) or (t.startswith("'") and t.endswith("'")):
        t = t[1:-1].strip()
    return t

def parse_text_to_hierarchy(text: str) -> List[Tuple[int, str]]:
    """
    Parses Markdown headers, indented bullets, numbered lists, and raw lines
    into a list of (level, text) tuples.
    """
    if not text or not text.strip():
        return []

    raw_lines = text.splitlines()
    has_headers = any(re.match(r'^\s*#{1,6}\s+\S+', line) for line in raw_lines)

    parsed_items: List[Tuple[int, str]] = []
    current_header_level = 0

    for raw_line in raw_lines:
        if not raw_line.strip():
            continue

        # Expand tabs to 2 spaces for consistent indent measurement
        expanded = raw_line.expandtabs(2)
        leading_spaces = len(expanded) - len(expanded.lstrip(' '))
        stripped = expanded.strip()

        # 1. Markdown Header: e.g. # Header 1, ## Header 2
        header_match = re.match(r'^(#{1,6})\s+(.*)$', stripped)
        if header_match:
            h_hashes = header_match.group(1)
            content = clean_text_line(header_match.group(2))
            if content:
                h_level = len(h_hashes) - 1  # # -> 0, ## -> 1, etc.
                current_header_level = h_level
                parsed_items.append((h_level, content))
            continue

        # 2. Bullet Point: e.g. - item, * item, + item, • item
        bullet_match = re.match(r'^[-*+•–]\s+(.*)$', stripped)
        if bullet_match:
            content = clean_text_line(bullet_match.group(1))
            if content:
                indent_level = leading_spaces // 2
                if has_headers:
                    item_level = current_header_level + 1 + indent_level
                else:
                    item_level = indent_level
                parsed_items.append((item_level, content))
            continue

        # 3. Numbered List: e.g. 1. Item, 1) Item, 1.1 Item, 1.1. Item, 1.2.3 Item
        num_match = re.match(r'^(?:(\d+(?:\.\d+)+)[\.\)]?|(\d+)[\.\)])\s+(.*)$', stripped)
        if num_match:
            num_str = num_match.group(1) or num_match.group(2)
            content = clean_text_line(num_match.group(3))
            if content:
                dots = num_str.count('.')
                indent_level = leading_spaces // 2
                num_level = max(dots, indent_level)
                if has_headers:
                    item_level = current_header_level + 1 + num_level
                else:
                    item_level = num_level
                parsed_items.append((item_level, content))
            continue

        # 4. Plain Text Line
        content = clean_text_line(stripped)
        if content:
            indent_level = leading_spaces // 2
            if has_headers:
                item_level = current_header_level + 1 + indent_level
            else:
                item_level = indent_level
            parsed_items.append((item_level, content))

    return parsed_items

def generate_mindmap_tree(text: str, title: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a hierarchical MindmapNode tree dictionary from raw text/markdown.
    Guarantees non-empty valid root node with multi-level children and distinct colors.
    """
    items = parse_text_to_hierarchy(text)

    # If text is empty or blank, return a default template
    if not items:
        default_title = (title or "").strip() or "Ý tưởng chính"
        return {
            "id": "node-root",
            "text": default_title,
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": [
                {
                    "id": f"node-{uuid.uuid4().hex[:8]}",
                    "text": "Nhánh 1",
                    "color": PALETTE[0],
                    "isCollapsed": False,
                    "collapsed": False,
                    "notes": "",
                    "children": []
                },
                {
                    "id": f"node-{uuid.uuid4().hex[:8]}",
                    "text": "Nhánh 2",
                    "color": PALETTE[1],
                    "isCollapsed": False,
                    "collapsed": False,
                    "notes": "",
                    "children": []
                }
            ]
        }

    # Normalize minimum level to 0
    min_level = min(item[0] for item in items)
    normalized = [(item[0] - min_level, item[1]) for item in items]

    has_headers = any(re.match(r'^\s*#{1,6}\s+\S+', line) for line in text.splitlines())
    has_explicit_title = bool(title and title.strip())

    # Check if there is a single natural root (level 0 at index 0 and no other level 0)
    level_0_count = sum(1 for lvl, _ in normalized if lvl == 0)

    # A single level 0 item represents the root if:
    # 1. No explicit title was supplied (so the lone level 0 item naturally becomes root text)
    # 2. OR the document uses Markdown headers (where a single # H1 header IS the document title, replaced by title if supplied)
    if level_0_count == 1 and normalized[0][0] == 0 and (not has_explicit_title or has_headers):
        # First item is root
        root_text = (title or "").strip() or normalized[0][1]
        root_node = {
            "id": "node-root",
            "text": root_text,
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }
        items_to_process = normalized[1:]
    else:
        # Multiple top-level items, OR explicit title supplied for a non-header outline (bullets/numbers):
        # Create root node with the title (or fallback "Ý tưởng chính"), and keep all items as descendants.
        root_text = (title or "").strip() or "Ý tưởng chính"
        root_node = {
            "id": "node-root",
            "text": root_text,
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }
        # Shift all items by +1 so they become children/descendants of root
        items_to_process = [(lvl + 1, txt) for lvl, txt in normalized]

    # Stack holds (level, node_dict, branch_color)
    stack: List[Tuple[int, Dict[str, Any], str]] = [(0, root_node, ROOT_COLOR)]
    branch_color_idx = 0

    for level, txt in items_to_process:
        target_level = max(1, level)

        # Pop stack until top level < target_level
        while len(stack) > 1 and stack[-1][0] >= target_level:
            stack.pop()

        parent_level, parent_node, parent_color = stack[-1]

        # Determine color: Level 1 branches get palette colors; deeper nodes inherit branch color
        if parent_level == 0:
            node_color = PALETTE[branch_color_idx % len(PALETTE)]
            branch_color_idx += 1
        else:
            node_color = parent_color

        new_node = {
            "id": f"node-{uuid.uuid4().hex[:8]}",
            "text": txt,
            "color": node_color,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }

        parent_node["children"].append(new_node)
        stack.append((target_level, new_node, node_color))

    return root_node

def count_tree_nodes(node: Dict[str, Any]) -> int:
    """Recursively count all nodes in tree including root."""
    if not node:
        return 0
    count = 1
    for child in node.get("children", []):
        count += count_tree_nodes(child)
    return count

def extract_flashcards_from_tree(root_node: Dict[str, Any], deck_name: str) -> List[Dict[str, str]]:
    """
    Extracts question/answer flashcards from a mindmap tree hierarchy.
    Parent nodes become questions; children become answers/bullet points.
    """
    cards: List[Dict[str, str]] = []

    def traverse(node: Dict[str, Any]):
        children = node.get("children", [])
        text = node.get("text", "").strip()
        notes = node.get("notes", "").strip()

        if children:
            # Question is parent text, Answer is bulleted list of children
            bullet_answers = "\n".join(f"• {c.get('text', '').strip()}" for c in children if c.get('text'))
            back_text = bullet_answers
            if notes:
                back_text = f"{notes}\n\n{bullet_answers}"
            cards.append({
                "front": text,
                "back": back_text
            })
            for child in children:
                traverse(child)
        elif notes:
            cards.append({
                "front": text,
                "back": notes
            })

    traverse(root_node)

    # Fallback if no cards generated (e.g. single node)
    if not cards and root_node:
        cards.append({
            "front": root_node.get("text", "Sơ đồ tư duy"),
            "back": f"Chủ đề trọng tâm của bộ flashcard {deck_name}"
        })

    return cards
