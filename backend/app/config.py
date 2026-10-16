import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
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

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", 5173))
