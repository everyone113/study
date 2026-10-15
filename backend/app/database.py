import aiosqlite
from app.config import DATABASE_PATH

async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            credits INTEGER DEFAULT 3,
            teacher TEXT DEFAULT '',
            room TEXT DEFAULT '',
            schedule TEXT DEFAULT '',
            semester TEXT DEFAULT 'Học kỳ 1',
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            attendance REAL DEFAULT NULL,
            midterm REAL DEFAULT NULL,
            final REAL DEFAULT NULL,
            other REAL DEFAULT NULL,
            weight_attendance REAL DEFAULT 0.1,
            weight_midterm REAL DEFAULT 0.3,
            weight_final REAL DEFAULT 0.6,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER DEFAULT NULL,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            remind_at TEXT DEFAULT NULL,
            deadline TEXT DEFAULT NULL,
            is_completed INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'normal',
            tag TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER DEFAULT NULL,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            source_url TEXT DEFAULT '',
            file_size INTEGER DEFAULT 0,
            file_type TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_name TEXT NOT NULL,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            box INTEGER DEFAULT 1,
            next_review TEXT DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.commit()
