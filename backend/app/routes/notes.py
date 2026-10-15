from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import aiosqlite

from app.database import get_db
from app.models.notes import NoteCreate, NoteUpdate

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.get("")
async def get_notes(
    subject_id: Optional[int] = Query(None),
    is_completed: Optional[int] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
        SELECT n.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
        FROM notes n
        LEFT JOIN subjects s ON n.subject_id = s.id
        WHERE 1=1
    """
    params = []
    if subject_id is not None:
        query += " AND n.subject_id = ?"
        params.append(subject_id)
    if is_completed is not None:
        query += " AND n.is_completed = ?"
        params.append(is_completed)

    query += " ORDER BY n.is_completed ASC, n.deadline ASC, n.id DESC"
    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("")
async def create_note(note: NoteCreate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("""
        INSERT INTO notes (subject_id, title, content, remind_at, deadline, priority, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (note.subject_id, note.title, note.content, note.remind_at, note.deadline, note.priority, note.tag))
    await db.commit()
    note_id = cursor.lastrowid
    cursor = await db.execute("""
        SELECT n.*, s.name as subject_name, s.code as subject_code
        FROM notes n
        LEFT JOIN subjects s ON n.subject_id = s.id
        WHERE n.id = ?
    """, (note_id,))
    created = await cursor.fetchone()
    return dict(created)

@router.put("/{id}")
async def update_note(id: int, note: NoteUpdate, db: aiosqlite.Connection = Depends(get_db)):
    fields = []
    values = []
    for k, v in note.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)
    if not fields:
        return {"message": "No changes"}
    values.append(id)
    await db.execute(f"UPDATE notes SET {', '.join(fields)} WHERE id = ?", tuple(values))
    await db.commit()
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (id,))
    updated = await cursor.fetchone()
    if not updated:
        raise HTTPException(status_code=404, detail="Note not found")
    return dict(updated)

@router.put("/{id}/toggle")
async def toggle_note(id: int, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT is_completed FROM notes WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    new_status = 1 if row["is_completed"] == 0 else 0
    await db.execute("UPDATE notes SET is_completed = ? WHERE id = ?", (new_status, id))
    await db.commit()
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (id,))
    updated = await cursor.fetchone()
    return dict(updated)

@router.delete("/{id}")
async def delete_note(id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM notes WHERE id = ?", (id,))
    await db.commit()
    return {"status": "ok", "message": "Deleted successfully"}
