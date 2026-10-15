from fastapi import APIRouter, Depends, HTTPException
import aiosqlite

from app.database import get_db
from app.models.academic import SubjectCreate, SubjectUpdate, GradeUpdate, calculate_gpa, classify_gpa

router = APIRouter(prefix="/api", tags=["Academic"])

@router.get("/subjects")
async def get_subjects(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("""
        SELECT s.*, g.attendance, g.midterm, g.final, g.other,
               g.weight_attendance, g.weight_midterm, g.weight_final
        FROM subjects s
        LEFT JOIN grades g ON s.id = g.subject_id
        ORDER BY s.id DESC
    """)
    rows = await cursor.fetchall()
    subjects = []
    for r in rows:
        row = dict(r)
        # Compute final grade if components exist
        att = row.get("attendance")
        mid = row.get("midterm")
        fin = row.get("final")
        w_att = row.get("weight_attendance") or 0.1
        w_mid = row.get("weight_midterm") or 0.3
        w_fin = row.get("weight_final") or 0.6

        total_10 = None
        gpa_4 = None
        letter = None
        if att is not None and mid is not None and fin is not None:
            total_10 = round(att * w_att + mid * w_mid + fin * w_fin, 2)
            gpa_4, letter = calculate_gpa(total_10)

        row["grade"] = {
            "attendance": att,
            "midterm": mid,
            "final": fin,
            "other": row.get("other"),
            "weight_attendance": w_att,
            "weight_midterm": w_mid,
            "weight_final": w_fin,
            "total_score_10": total_10,
            "gpa_4": gpa_4,
            "letter_grade": letter
        }
        subjects.append(row)
    return subjects

@router.post("/subjects")
async def create_subject(sub: SubjectCreate, db: aiosqlite.Connection = Depends(get_db)):
    try:
        cursor = await db.execute("""
            INSERT INTO subjects (code, name, credits, teacher, room, schedule, semester, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (sub.code, sub.name, sub.credits, sub.teacher, sub.room, sub.schedule, sub.semester, sub.color))
        await db.commit()
        sub_id = cursor.lastrowid
        # Also create initial empty grade record
        await db.execute("INSERT INTO grades (subject_id) VALUES (?)", (sub_id,))
        await db.commit()

        cursor = await db.execute("SELECT * FROM subjects WHERE id = ?", (sub_id,))
        created = await cursor.fetchone()
        return dict(created)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail=f"Mã môn học '{sub.code}' đã tồn tại!")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/subjects/{id}")
async def update_subject(id: int, sub: SubjectUpdate, db: aiosqlite.Connection = Depends(get_db)):
    fields = []
    values = []
    for k, v in sub.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)
    if not fields:
        return {"message": "No changes"}
    values.append(id)
    await db.execute(f"UPDATE subjects SET {', '.join(fields)} WHERE id = ?", tuple(values))
    await db.commit()
    cursor = await db.execute("SELECT * FROM subjects WHERE id = ?", (id,))
    updated = await cursor.fetchone()
    if not updated:
        raise HTTPException(status_code=404, detail="Subject not found")
    return dict(updated)

@router.delete("/subjects/{id}")
async def delete_subject(id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM grades WHERE subject_id = ?", (id,))
    await db.execute("DELETE FROM subjects WHERE id = ?", (id,))
    await db.commit()
    return {"status": "ok", "message": "Deleted successfully"}

@router.post("/subjects/{id}/grades")
async def update_subject_grades(id: int, grade: GradeUpdate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM subjects WHERE id = ?", (id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Subject not found")

    await db.execute("""
        INSERT INTO grades (subject_id, attendance, midterm, final, other, weight_attendance, weight_midterm, weight_final)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            attendance=excluded.attendance,
            midterm=excluded.midterm,
            final=excluded.final,
            other=excluded.other,
            weight_attendance=excluded.weight_attendance,
            weight_midterm=excluded.weight_midterm,
            weight_final=excluded.weight_final
    """, (id, grade.attendance, grade.midterm, grade.final, grade.other,
          grade.weight_attendance, grade.weight_midterm, grade.weight_final))
    # In SQLite without unique on subject_id in grades, update existing grade for subject_id:
    await db.execute("""
        UPDATE grades SET
            attendance = ?,
            midterm = ?,
            final = ?,
            other = ?,
            weight_attendance = ?,
            weight_midterm = ?,
            weight_final = ?
        WHERE subject_id = ?
    """, (grade.attendance, grade.midterm, grade.final, grade.other,
          grade.weight_attendance, grade.weight_midterm, grade.weight_final, id))
    await db.commit()

    total_10 = None
    gpa_4 = None
    letter = None
    if grade.attendance is not None and grade.midterm is not None and grade.final is not None:
        total_10 = round(grade.attendance * grade.weight_attendance + grade.midterm * grade.weight_midterm + grade.final * grade.weight_final, 2)
        gpa_4, letter = calculate_gpa(total_10)

    return {
        "subject_id": id,
        "attendance": grade.attendance,
        "midterm": grade.midterm,
        "final": grade.final,
        "other": grade.other,
        "total_score_10": total_10,
        "gpa_4": gpa_4,
        "letter_grade": letter
    }

@router.get("/gpa/summary")
async def get_gpa_summary(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("""
        SELECT s.credits, g.attendance, g.midterm, g.final,
               g.weight_attendance, g.weight_midterm, g.weight_final
        FROM subjects s
        JOIN grades g ON s.id = g.subject_id
    """)
    rows = await cursor.fetchall()
    total_credits = 0
    weighted_score_10 = 0.0
    weighted_score_4 = 0.0
    counted_credits = 0

    for r in rows:
        row = dict(r)
        credits = row.get("credits") or 0
        total_credits += credits
        att = row.get("attendance")
        mid = row.get("midterm")
        fin = row.get("final")
        if att is not None and mid is not None and fin is not None and credits > 0:
            w_att = row.get("weight_attendance") or 0.1
            w_mid = row.get("weight_midterm") or 0.3
            w_fin = row.get("weight_final") or 0.6
            sub_10 = att * w_att + mid * w_mid + fin * w_fin
            sub_4, _ = calculate_gpa(sub_10)

            weighted_score_10 += sub_10 * credits
            weighted_score_4 += sub_4 * credits
            counted_credits += credits

    gpa_10 = round(weighted_score_10 / counted_credits, 2) if counted_credits > 0 else 0.0
    gpa_4 = round(weighted_score_4 / counted_credits, 2) if counted_credits > 0 else 0.0

    return {
        "total_credits": total_credits,
        "graded_credits": counted_credits,
        "gpa_10": gpa_10,
        "gpa_4": gpa_4,
        "classification": classify_gpa(gpa_4)
    }
