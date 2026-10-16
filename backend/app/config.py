import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

IS_VERCEL = bool(os.getenv("VERCEL"))
if IS_VERCEL:
    DATA_DIR = Path("/tmp/data")
    DOWNLOADS_DIR = Path("/tmp/downloads")
    PROCESSED_DIR = Path("/tmp/processed")
    DOCUMENTS_DIR = Path("/tmp/documents")
    DROP_DIR = Path("/tmp/wifidrop")
else:
    DATA_DIR = BASE_DIR / "data"
    DOWNLOADS_DIR = BASE_DIR / "downloads"
    PROCESSED_DIR = BASE_DIR / "processed"
    DOCUMENTS_DIR = BASE_DIR / "documents"
    DROP_DIR = BASE_DIR / "wifidrop"

DATA_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
DROP_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATA_DIR / "studymedia.db"

# Copy seed DB if on Vercel and not yet in /tmp
if IS_VERCEL and not DATABASE_PATH.exists():
    seed_db = BASE_DIR / "data" / "studymedia.db"
    if seed_db.exists():
        try:
            shutil.copy2(seed_db, DATABASE_PATH)
        except Exception:
            pass

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", 5173))
