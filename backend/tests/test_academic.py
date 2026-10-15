import pytest
import uuid
from httpx import AsyncClient, ASGITransport

@pytest.mark.anyio
async def test_subject_and_gpa_flow():
    from app.main import app
    from app.database import init_db
    await init_db()

    code = f"CS_{uuid.uuid4().hex[:6].upper()}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create subject
        sub_data = {
            "code": code,
            "name": "Nhập môn Lập trình Java",
            "credits": 4,
            "teacher": "TS. Nguyễn Văn A",
            "room": "A2-301",
            "schedule": "Thứ 2 (07:00 - 11:30)",
            "semester": "Học kỳ 1",
            "color": "#3b82f6"
        }
        res = await client.post("/api/subjects", json=sub_data)
        assert res.status_code == 200, res.text
        sub = res.json()
        sub_id = sub["id"]
        assert sub["code"] == code
        assert sub["credits"] == 4

        # 2. Add grades: attendance=10, midterm=8.5, final=9.0
        # Expected score: 10*0.1 + 8.5*0.3 + 9.0*0.6 = 1.0 + 2.55 + 5.4 = 8.95
        # 8.95 >= 8.5 -> Grade A -> 4.0
        grade_data = {
            "attendance": 10.0,
            "midterm": 8.5,
            "final": 9.0,
            "weight_attendance": 0.1,
            "weight_midterm": 0.3,
            "weight_final": 0.6
        }
        res_grade = await client.post(f"/api/subjects/{sub_id}/grades", json=grade_data)
        assert res_grade.status_code == 200, res_grade.text
        grade_res = res_grade.json()
        assert abs(grade_res["total_score_10"] - 8.95) < 0.01
        assert grade_res["gpa_4"] == 4.0
        assert grade_res["letter_grade"] == "A"

        # 3. Check GPA summary
        res_gpa = await client.get("/api/gpa/summary")
        assert res_gpa.status_code == 200
        gpa_summary = res_gpa.json()
        assert gpa_summary["total_credits"] >= 4
        assert gpa_summary["gpa_4"] == 4.0
        assert "Xuất sắc" in gpa_summary["classification"] or "Giỏi" in gpa_summary["classification"]
