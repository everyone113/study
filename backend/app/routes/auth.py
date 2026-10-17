import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Secure hash using SHA-256 with cryptographic salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify raw password against salt:hash format."""
    try:
        salt, _ = stored_hash.split(":", 1)
        expected = hash_password(password, salt)
        return expected == stored_hash
    except Exception:
        return False

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    student_id: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    avatar: Optional[str] = ""
    google_id: Optional[str] = ""

@router.post("/register")
async def register(req: RegisterRequest, db = Depends(get_db)):
    """Register a new student/creator account."""
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự.")

    email_clean = req.email.strip().lower()
    
    # Check duplicate email
    cursor = await db.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
    existing = await cursor.fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký. Vui lòng đăng nhập.")

    user_id = f"usr_{secrets.token_hex(5)}"
    pwd_hash = hash_password(req.password)
    default_avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={req.name}&backgroundColor=2563eb,4f46e5"

    await db.execute("""
        INSERT INTO users (id, email, name, avatar, password_hash, provider, student_id)
        VALUES (?, ?, ?, ?, ?, 'email', ?)
    """, (user_id, email_clean, req.name.strip(), default_avatar, pwd_hash, req.student_id.strip() if req.student_id else ""))
    
    # Init empty cloud sync vault
    await db.execute("""
        INSERT OR IGNORE INTO user_sync (user_id) VALUES (?)
    """, (user_id,))
    
    await db.commit()

    token = secrets.token_urlsafe(32)
    return {
        "success": True,
        "message": "Đăng ký tài khoản thành công!",
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": req.name.strip(),
            "avatar": default_avatar,
            "student_id": req.student_id.strip() if req.student_id else "",
            "provider": "email"
        },
        "token": token
    }

@router.post("/login")
async def login(req: LoginRequest, db = Depends(get_db)):
    """Login with email and password."""
    email_clean = req.email.strip().lower()
    cursor = await db.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
    user = await cursor.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

    user_dict = dict(user)
    if not verify_password(req.password, user_dict.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

    token = secrets.token_urlsafe(32)
    return {
        "success": True,
        "message": "Đăng nhập thành công!",
        "user": {
            "id": user_dict["id"],
            "email": user_dict["email"],
            "name": user_dict["name"],
            "avatar": user_dict["avatar"],
            "student_id": user_dict.get("student_id", ""),
            "provider": user_dict.get("provider", "email")
        },
        "token": token
    }

@router.post("/google")
async def google_auth(req: GoogleAuthRequest, db = Depends(get_db)):
    """1-Click Google Sign-In with automatic account provisioning."""
    email_clean = req.email.strip().lower()
    cursor = await db.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
    user = await cursor.fetchone()

    avatar = req.avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={req.name}&backgroundColor=0284c7,38bdf8"

    if user:
        user_dict = dict(user)
        # Update avatar or google_id if provided
        if req.avatar and not user_dict.get("avatar"):
            await db.execute("UPDATE users SET avatar = ? WHERE id = ?", (req.avatar, user_dict["id"]))
            await db.commit()
        user_id = user_dict["id"]
        user_name = user_dict["name"]
        user_avatar = user_dict["avatar"] or avatar
        student_id = user_dict.get("student_id", "")
    else:
        user_id = f"usr_{secrets.token_hex(5)}"
        await db.execute("""
            INSERT INTO users (id, email, name, avatar, provider, google_id)
            VALUES (?, ?, ?, ?, 'google', ?)
        """, (user_id, email_clean, req.name.strip(), avatar, req.google_id or ""))
        
        await db.execute("""
            INSERT OR IGNORE INTO user_sync (user_id) VALUES (?)
        """, (user_id,))
        
        await db.commit()
        user_name = req.name.strip()
        user_avatar = avatar
        student_id = ""

    token = secrets.token_urlsafe(32)
    return {
        "success": True,
        "message": "Đăng nhập bằng tài khoản Google thành công!",
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": user_name,
            "avatar": user_avatar,
            "student_id": student_id,
            "provider": "google"
        },
        "token": token
    }
