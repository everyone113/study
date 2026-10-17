import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_register_and_login():
    test_email = "teststudent1@example.com"
    test_password = "password123"
    test_name = "Sinh Vien Test"

    # Register
    res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "student_id": "B22DCCN001"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["user"]["email"] == test_email
    assert data["user"]["id"].startswith("usr_")

    user_id = data["user"]["id"]

    # Login with same credentials
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert login_data["user"]["id"] == user_id

def test_auth_google_login():
    g_email = "googlestudent@gmail.com"
    g_name = "Google Student"

    res = client.post("/api/auth/google", json={
        "email": g_email,
        "name": g_name,
        "avatar": "https://example.com/avatar.png",
        "google_id": "g_123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["user"]["email"] == g_email
    assert data["user"]["provider"] == "google"

def test_cloud_sync_push_and_pull():
    user_id = "usr_synctest_999"
    test_subjects = [{"id": 1, "code": "CS101", "name": "Lap Trinh C++", "credits": 3}]
    test_notes = [{"id": 1, "title": "On thi cuoi ky", "priority": "high"}]

    # Push sync data
    push_res = client.post("/api/sync/push", json={
        "user_id": user_id,
        "academic_subjects": test_subjects,
        "notes": test_notes,
        "gpa_summary": {"gpa_10": 9.2, "gpa_4": 3.8}
    })
    assert push_res.status_code == 200
    assert push_res.json()["success"] is True

    # Pull sync data
    pull_res = client.get(f"/api/sync/pull?user_id={user_id}")
    assert pull_res.status_code == 200
    pull_data = pull_res.json()
    assert pull_data["success"] is True
    assert pull_data["has_data"] is True
    assert len(pull_data["data"]["academic_subjects"]) == 1
    assert pull_data["data"]["academic_subjects"][0]["code"] == "CS101"
    assert pull_data["data"]["gpa_summary"]["gpa_10"] == 9.2
