import json
import uuid
from typing import Optional, List, Dict, Any
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_db
from app.models.mindmap import (
    MindmapCreate,
    MindmapUpdate,
    MindmapResponse,
    MindmapSummary,
    MindmapGenerateRequest,
    MindmapExportFlashcardsRequest,
)
from app.services.mindmap_generator import (
    generate_mindmap_tree,
    count_tree_nodes,
    extract_flashcards_from_tree,
    ROOT_COLOR,
    PALETTE,
)

router = APIRouter(prefix="/api/mindmap", tags=["Mindmap"])

def _parse_root_node(raw_json: Any) -> Dict[str, Any]:
    """Safely parse root_node from JSON string or return as dict."""
    if isinstance(raw_json, dict):
        return raw_json
    if not raw_json or not isinstance(raw_json, str):
        return {
            "id": "node-root",
            "text": "Ý tưởng chính",
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }
    try:
        return json.loads(raw_json)
    except Exception:
        return {
            "id": "node-root",
            "text": "Ý tưởng chính",
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }

@router.get("", response_model=List[MindmapSummary])
async def list_mindmaps(
    user_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Retrieve list of mindmaps with optional user_id and search filters."""
    query = "SELECT id, user_id, title, description, root_node, tags, created_at, updated_at FROM mindmaps WHERE 1=1"
    params: List[Any] = []

    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"
        params.extend([term, term, term])

    query += " ORDER BY updated_at DESC, created_at DESC"

    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()

    results: List[Dict[str, Any]] = []
    for row in rows:
        r_dict = dict(row)
        tree = _parse_root_node(r_dict.get("root_node"))
        node_count = count_tree_nodes(tree)
        results.append({
            "id": r_dict["id"],
            "user_id": r_dict.get("user_id") or "guest",
            "title": r_dict["title"],
            "description": r_dict.get("description") or "",
            "tags": r_dict.get("tags") or "General",
            "created_at": str(r_dict.get("created_at") or ""),
            "updated_at": str(r_dict.get("updated_at") or ""),
            "node_count": node_count,
        })
    return results

@router.post("", response_model=MindmapResponse, status_code=status.HTTP_201_CREATED)
async def create_mindmap(
    payload: MindmapCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new mindmap with structured root node."""
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    root = payload.root_node or payload.root_data
    if not root:
        root = {
            "id": "node-root",
            "text": payload.title.strip(),
            "color": ROOT_COLOR,
            "isCollapsed": False,
            "collapsed": False,
            "notes": "",
            "children": []
        }
    elif hasattr(root, "model_dump"):
        root = root.model_dump()

    root_json = json.dumps(root, ensure_ascii=False)
    mindmap_id = f"mm_{uuid.uuid4().hex[:12]}"
    user_id = payload.user_id or "guest"
    description = payload.description or ""
    tags = payload.tags or "General"

    await db.execute("""
        INSERT INTO mindmaps (id, user_id, title, description, root_node, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (mindmap_id, user_id, payload.title.strip(), description, root_json, tags))
    await db.commit()

    cursor = await db.execute("SELECT * FROM mindmaps WHERE id = ?", (mindmap_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to retrieve created mindmap")

    r_dict = dict(row)
    tree = _parse_root_node(r_dict["root_node"])
    node_count = count_tree_nodes(tree)

    return {
        "id": r_dict["id"],
        "user_id": r_dict.get("user_id") or "guest",
        "title": r_dict["title"],
        "description": r_dict.get("description") or "",
        "root_node": tree,
        "root_data": tree,
        "tags": r_dict.get("tags") or "General",
        "created_at": str(r_dict.get("created_at") or ""),
        "updated_at": str(r_dict.get("updated_at") or ""),
        "node_count": node_count,
    }

@router.get("/{id}", response_model=MindmapResponse)
async def get_mindmap(
    id: str,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Retrieve full mindmap details by ID."""
    cursor = await db.execute("SELECT * FROM mindmaps WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Mindmap with id '{id}' not found")

    r_dict = dict(row)
    tree = _parse_root_node(r_dict["root_node"])
    node_count = count_tree_nodes(tree)

    return {
        "id": r_dict["id"],
        "user_id": r_dict.get("user_id") or "guest",
        "title": r_dict["title"],
        "description": r_dict.get("description") or "",
        "root_node": tree,
        "root_data": tree,
        "tags": r_dict.get("tags") or "General",
        "created_at": str(r_dict.get("created_at") or ""),
        "updated_at": str(r_dict.get("updated_at") or ""),
        "node_count": node_count,
    }

@router.put("/{id}", response_model=MindmapResponse)
async def update_mindmap(
    id: str,
    payload: MindmapUpdate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Update title, description, root_node, or tags of an existing mindmap."""
    cursor = await db.execute("SELECT * FROM mindmaps WHERE id = ?", (id,))
    existing = await cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail=f"Mindmap with id '{id}' not found")

    updates: List[str] = ["updated_at = datetime('now')"]
    params: List[Any] = []

    if payload.title is not None:
        if not payload.title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        updates.append("title = ?")
        params.append(payload.title.strip())

    if payload.description is not None:
        updates.append("description = ?")
        params.append(payload.description)

    root = payload.root_node or payload.root_data
    if root is not None:
        if hasattr(root, "model_dump"):
            root = root.model_dump()
        updates.append("root_node = ?")
        params.append(json.dumps(root, ensure_ascii=False))

    if payload.tags is not None:
        updates.append("tags = ?")
        params.append(payload.tags)

    params.append(id)
    update_sql = f"UPDATE mindmaps SET {', '.join(updates)} WHERE id = ?"
    await db.execute(update_sql, tuple(params))
    await db.commit()

    cursor = await db.execute("SELECT * FROM mindmaps WHERE id = ?", (id,))
    row = await cursor.fetchone()
    r_dict = dict(row)
    tree = _parse_root_node(r_dict["root_node"])
    node_count = count_tree_nodes(tree)

    return {
        "id": r_dict["id"],
        "user_id": r_dict.get("user_id") or "guest",
        "title": r_dict["title"],
        "description": r_dict.get("description") or "",
        "root_node": tree,
        "root_data": tree,
        "tags": r_dict.get("tags") or "General",
        "created_at": str(r_dict.get("created_at") or ""),
        "updated_at": str(r_dict.get("updated_at") or ""),
        "node_count": node_count,
    }

@router.delete("/{id}")
async def delete_mindmap(
    id: str,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete a mindmap by ID."""
    cursor = await db.execute("SELECT id FROM mindmaps WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Mindmap with id '{id}' not found")

    await db.execute("DELETE FROM mindmaps WHERE id = ?", (id,))
    await db.commit()
    return {"status": "ok", "message": f"Mindmap {id} deleted successfully"}

@router.post("/generate")
async def generate_mindmap(
    payload: MindmapGenerateRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Parse text into a mindmap hierarchy, optionally saving directly to database."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    tree = generate_mindmap_tree(text=payload.text, title=payload.title)
    node_count = count_tree_nodes(tree)
    mindmap_title = (payload.title or "").strip() or tree.get("text", "Sơ đồ tư duy")

    if payload.save:
        mindmap_id = f"mm_{uuid.uuid4().hex[:12]}"
        root_json = json.dumps(tree, ensure_ascii=False)
        user_id = payload.user_id or "guest"

        await db.execute("""
            INSERT INTO mindmaps (id, user_id, title, description, root_node, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (mindmap_id, user_id, mindmap_title, "Tự động tạo từ văn bản", root_json, "AI Generated"))
        await db.commit()

        return {
            "id": mindmap_id,
            "user_id": user_id,
            "title": mindmap_title,
            "description": "Tự động tạo từ văn bản",
            "root_node": tree,
            "root_data": tree,
            "tags": "AI Generated",
            "node_count": node_count,
            "saved": True
        }

    return {
        "title": mindmap_title,
        "root_node": tree,
        "root_data": tree,
        "node_count": node_count,
        "saved": False
    }

@router.post("/{id}/export-flashcards")
async def export_mindmap_to_flashcards(
    id: str,
    payload: Optional[MindmapExportFlashcardsRequest] = None,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Export mindmap nodes into StudyMediaHub flashcards repository."""
    cursor = await db.execute("SELECT * FROM mindmaps WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Mindmap with id '{id}' not found")

    r_dict = dict(row)
    tree = _parse_root_node(r_dict["root_node"])
    deck_name = (payload.deck_name if payload and payload.deck_name else None) or f"Mindmap: {r_dict['title']}"

    if payload and payload.cards:
        cards_to_insert = [{"front": c.front, "back": c.back} for c in payload.cards]
    else:
        cards_to_insert = extract_flashcards_from_tree(tree, deck_name)

    inserted = 0
    for card in cards_to_insert:
        await db.execute("""
            INSERT INTO flashcards (deck_name, front, back)
            VALUES (?, ?, ?)
        """, (deck_name, card["front"], card["back"]))
        inserted += 1

    await db.commit()

    return {
        "status": "ok",
        "deck_name": deck_name,
        "exported_count": inserted,
        "cards": cards_to_insert
    }

@router.post("/export-flashcards")
async def export_custom_flashcards(
    payload: MindmapExportFlashcardsRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Export a custom list of flashcards from the Mindmap Studio."""
    deck_name = payload.deck_name or "Mindmap Flashcards"
    cards = payload.cards or []

    inserted = 0
    for card in cards:
        await db.execute("""
            INSERT INTO flashcards (deck_name, front, back)
            VALUES (?, ?, ?)
        """, (deck_name, card.front, card.back))
        inserted += 1

    await db.commit()

    return {
        "status": "ok",
        "deck_name": deck_name,
        "exported_count": inserted
    }
