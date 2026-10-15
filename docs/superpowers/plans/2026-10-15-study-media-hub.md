# StudyMediaHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trạm điều hành cá nhân StudyMediaHub tại ổ D: kết hợp toàn diện giữa quản lý học tập (môn học, điểm GPA, ghi chú có ngày giờ, kho tài liệu), ôn luyện lập trình (Java JDK 21, C++, Python), bộ công cụ truyền thông sáng tạo (tải video TikTok/YouTube không logo, lách thuật toán quét trùng lặp video/ảnh, tách nền AI) và các tiện ích thông minh (dịch phụ đề thời gian thực khi xem video, tạo giọng đọc AI Edge-TTS, flashcards, pomodoro), hỗ trợ truy cập mượt mà trên cả PC và điện thoại.

**Architecture:** Ứng dụng Fullstack Client-Server. Backend sử dụng Python FastAPI cung cấp REST API và WebSocket, quản lý SQLite qua aiosqlite, tích hợp thư viện yt-dlp, FFmpeg, Edge-TTS và các thuật toán biến đổi dữ liệu file nhị phân. Frontend sử dụng React + Vite + Tailwind CSS + Lucide Icons, thiết kế Responsive chuẩn PWA để hoạt động như app native trên điện thoại và dashboard trên máy tính.

**Tech Stack:** Python 3.12, FastAPI, Uvicorn, SQLite/aiosqlite, yt-dlp, ffmpeg (đã có trong PATH), edge-tts, Pillow, Node.js, React, Vite, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-15-study-media-hub-design.md`

## Global Constraints
- Toàn bộ mã nguồn, cấu hình và dữ liệu phải nằm trọn trong `D:\admin\projects\StudyMediaHub`.
- Backend chạy trên port `8000`, Frontend chạy trên port `5173` (cho phép truy cập `--host 0.0.0.0` để điện thoại trong cùng mạng Wi-Fi kết nối).
- Các API trả về chuẩn JSON có status, message và data rõ ràng.
- Xử lý file đa phương tiện phải lưu vào thư mục `downloads` và `processed` trong backend với cơ chế dọn dẹp file tạm.
- Chạy được Java thông qua JDK 21 có sẵn (`C:\Users\admin\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe`) và C++/Python.

## Review Focus
- **Xử lý URL tải video không hợp lệ:** Trả về lỗi 400 và thông báo rõ ràng, không làm crash server.
- **Tính toán GPA:** Xử lý chuẩn xác các trường hợp môn 0 tín chỉ, môn chưa có điểm, điểm thành phần thiếu.
- **Lách trùng lặp video:** Đảm bảo video sau khi biến đổi vẫn xem được mượt mà trên mọi đầu phát, không bị lệch audio/video sync.
- **Bảo mật đường dẫn file:** Ngăn chặn Path Traversal khi người dùng tải hoặc yêu cầu đọc file tài liệu.
- **Truy cập từ điện thoại di động:** Giao diện co giãn chuẩn, không bị vỡ layout, các nút bấm vừa ngón tay cảm ứng.

---

### Task 1: Scaffolding Backend & Core Database Setup
**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Produces: `GET /api/health` -> `{"status": "ok", "app": "StudyMediaHub", "version": "1.0.0"}`
- Produces: `database.init_db()` -> Khởi tạo các bảng SQLite: `subjects`, `grades`, `notes`, `documents`, `flashcards`.

- [ ] **Step 1: Viết test kiểm tra health check**
  Tạo `backend/tests/test_health.py` kiểm tra endpoint `/api/health`.

- [ ] **Step 2: Cài đặt dependencies backend**
  Tạo `backend/requirements.txt` với `fastapi`, `uvicorn`, `aiosqlite`, `pydantic`, `python-multipart`, `yt-dlp`, `edge-tts`, `pillow`, `requests`, `pytest`, `httpx`. Chạy cài đặt vào môi trường Python.

- [ ] **Step 3: Triển khai config, database và main.py**
  Thiết lập database SQLite tại `backend/data/studymedia.db` và cấu hình CORS mở rộng cho kết nối điện thoại (`allow_origins=["*"]`).

- [ ] **Step 4: Chạy test xác nhận pass**
  Run: `pytest backend/tests/test_health.py`

- [ ] **Step 5: Commit**
  `git add backend; git commit -m "feat: setup backend scaffolding and sqlite database"`

---

### Task 2: Academic & Student Management APIs (Môn học, Điểm số, GPA)
**Files:**
- Create: `backend/app/models/academic.py`
- Create: `backend/app/routes/academic.py`
- Test: `backend/tests/test_academic.py`

**Interfaces:**
- Produces: `POST /api/subjects` (tạo môn học: mã, tên, tín chỉ, giảng viên, phòng, lịch học)
- Produces: `GET /api/subjects` (lấy danh sách môn học kèm điểm và thống kê GPA)
- Produces: `PUT /api/subjects/{id}` (sửa môn học)
- Produces: `DELETE /api/subjects/{id}` (xóa môn học)
- Produces: `POST /api/subjects/{id}/grades` (cập nhật điểm chuyên cần, giữa kỳ, cuối kỳ)
- Produces: `GET /api/gpa/summary` (tổng kết GPA hệ 10, hệ 4, tổng tín chỉ, phân loại học lực)

- [ ] **Step 1: Viết test cho môn học và tính GPA**
- [ ] **Step 2: Triển khai schema Pydantic và database queries**
  Thuật toán tự động chuyển đổi điểm hệ 10 -> hệ 4 và điểm chữ theo chuẩn quy chế đào tạo đại học tín chỉ:
  - $\ge 8.5 \rightarrow 4.0$ (A)
  - $\ge 7.0 \rightarrow 3.0$ (B)
  - $\ge 5.5 \rightarrow 2.0$ (C)
  - $\ge 4.0 \rightarrow 1.0$ (D)
  - $< 4.0 \rightarrow 0$ (F)
- [ ] **Step 3: Chạy test xác nhận kết quả tính điểm**
- [ ] **Step 4: Commit**
  `git add backend/app/routes/academic.py backend/tests/test_academic.py; git commit -m "feat: academic and gpa calculation apis"`

---

### Task 3: Resource Downloader & Note Management APIs (Ghi chú ngày giờ & Tải tài liệu từ URL)
**Files:**
- Create: `backend/app/models/notes.py`
- Create: `backend/app/routes/notes.py`
- Create: `backend/app/routes/documents.py`
- Test: `backend/tests/test_notes_and_docs.py`

**Interfaces:**
- Produces: `GET /api/notes?subject_id={id}` & `POST /api/notes` (ghi chú có tiêu đề, nội dung, ngày giờ nhắc nhở, tag deadline, trạng thái)
- Produces: `PUT /api/notes/{id}/toggle` (chuyển trạng thái hoàn thành)
- Produces: `POST /api/documents/download-url` (nhập URL bất kỳ để tải file tài liệu PDF/doc/slide về thư mục tài liệu máy tính)
- Produces: `GET /api/documents` & `GET /api/documents/download/{id}` (quản lý và tải file)

- [ ] **Step 1: Viết test cho ghi chú và tải tài liệu**
- [ ] **Step 2: Triển khai logic ghi chú và streaming downloader cho tài liệu mạng**
- [ ] **Step 3: Chạy test xác nhận**
- [ ] **Step 4: Commit**
  `git add backend/app/routes/notes.py backend/app/routes/documents.py; git commit -m "feat: notes with datetime and document downloader apis"`

---

### Task 4: Code Runner Service (Java JDK 21, C++, Python)
**Files:**
- Create: `backend/app/services/code_runner.py`
- Create: `backend/app/routes/code_runner.py`
- Test: `backend/tests/test_code_runner.py`

**Interfaces:**
- Produces: `POST /api/code/run` -> Body: `{"language": "java"|"cpp"|"python", "code": "...", "stdin": "..."}`
  -> Response: `{"stdout": "...", "stderr": "...", "exit_code": 0, "execution_time_ms": 120}`
- Produces: `GET /api/code/snippets` -> Lấy danh sách bài tập mẫu, cheat sheet OOP, cấu trúc dữ liệu Java & C++.

- [ ] **Step 1: Viết test biên dịch & thực thi mã nguồn**
- [ ] **Step 2: Triển khai runner với subprocess an toàn có timeout**
  - Tự động phát hiện JDK 21 (`javac.exe` / `java.exe`)
  - Chạy C++ qua g++ hoặc fallback runner
  - Chạy Python trực tiếp
  - Giới hạn thời gian chạy tối đa 10s để chống vòng lặp vô tận.
- [ ] **Step 3: Chạy test xác nhận code Java / C++ / Python thực thi chính xác**
- [ ] **Step 4: Commit**
  `git add backend/app/services/code_runner.py backend/app/routes/code_runner.py; git commit -m "feat: multi-language code execution engine"`

---

### Task 5: Media Tools - TikTok & YouTube Downloader (Sạch Logo, Không Watermark)
**Files:**
- Create: `backend/app/services/media_downloader.py`
- Create: `backend/app/routes/media.py`
- Test: `backend/tests/test_media_downloader.py`

**Interfaces:**
- Produces: `POST /api/media/info` -> Lấy tiêu đề, thumbnail, định dạng tải của URL TikTok/YouTube
- Produces: `POST /api/media/download` -> Tải video sạch logo về máy và trả về link file đã sẵn sàng

- [ ] **Step 1: Viết test cho module trích xuất thông tin video**
- [ ] **Step 2: Triển khai tích hợp yt-dlp tối ưu hóa cho TikTok không logo và YouTube Shorts/Video chất lượng cao**
- [ ] **Step 3: Chạy test kiểm thử tải thông tin video**
- [ ] **Step 4: Commit**
  `git add backend/app/services/media_downloader.py backend/app/routes/media.py; git commit -m "feat: tiktok and youtube no-watermark downloader"`

---

### Task 6: Media Tools - Anti-Duplicate Processor (Lách Quét Trùng Lặp Video & Ảnh)
**Files:**
- Create: `backend/app/services/anti_duplicate.py`
- Modify: `backend/app/routes/media.py`
- Test: `backend/tests/test_anti_duplicate.py`

**Interfaces:**
- Produces: `POST /api/media/anti-duplicate/video`
  - Đầu vào: video gốc + các tùy chọn (đổi MD5, xóa Exif, vi lật 0.2%, vi chỉnh tốc độ 1.008x, điều chỉnh bitrate, thêm micro-noise, thay đổi audio sample rate).
  - Đầu ra: Video mới tinh về mặt chữ ký số (digital fingerprint), lách triệt để thuật toán phát hiện trùng lặp của TikTok/Reels/Shorts.
- Produces: `POST /api/media/anti-duplicate/image`
  - Xóa sạch Exif metadata, thay đổi micro-pixel ngẫu nhiên không thể nhìn thấy bằng mắt thường, đổi mã MD5 hoàn toàn mới.

- [ ] **Step 1: Viết test kiểm tra thay đổi hash và metadata của video/ảnh**
- [ ] **Step 2: Triển khai pipeline FFmpeg và Pillow thực hiện các biến đổi vi mô chống trùng lặp**
- [ ] **Step 3: Chạy test xác nhận mã hash trước và sau khác nhau 100% nhưng chất lượng video giữ nguyên**
- [ ] **Step 4: Commit**
  `git add backend/app/services/anti_duplicate.py; git commit -m "feat: anti-duplicate video and image processor"`

---

### Task 7: AI & Smart Utilities - Tách Nền Vật Thể, Edge-TTS, Pomodoro & Flashcard
**Files:**
- Create: `backend/app/services/bg_remover.py`
- Create: `backend/app/services/tts_service.py`
- Create: `backend/app/routes/smart_tools.py`
- Test: `backend/tests/test_smart_tools.py`

**Interfaces:**
- Produces: `POST /api/tools/remove-bg` -> Upload ảnh -> Trả về ảnh PNG tách nền vật thể/chủ thể siêu sạch
- Produces: `POST /api/tools/tts` -> `{"text": "...", "voice": "vi-VN-HoaiMyNeural"|"vi-VN-NamMinhNeural"|"en-US-JennyNeural"}` -> File MP3 giọng đọc tự nhiên
- Produces: `GET/POST /api/tools/flashcards` -> Quản lý bộ thẻ học Spaced Repetition
- Produces: `POST /api/tools/summarize` -> Tóm tắt nội dung tài liệu / văn bản học tập

- [ ] **Step 1: Viết test cho TTS, Flashcard và BG Remover**
- [ ] **Step 2: Triển khai Edge-TTS không cần API key, thuật toán tách nền và bộ flashcard**
- [ ] **Step 3: Chạy test xác nhận**
- [ ] **Step 4: Commit**
  `git add backend/app/services/ backend/app/routes/smart_tools.py; git commit -m "feat: bg remover, edge-tts, and smart study tools"`

---

### Task 8: Real-time Subtitle & Translation Player Engine
**Files:**
- Create: `backend/app/routes/subtitles.py`
- Create: `backend/app/services/translator.py`
- Test: `backend/tests/test_subtitles.py`

**Interfaces:**
- Produces: `POST /api/translate/text` -> Dịch câu/đoạn văn bản đa ngôn ngữ siêu tốc
- Produces: `GET /api/subtitles/extract` -> Trích xuất subtitle có sẵn từ video hoặc sinh sub tự động
- Produces: WebSocket `/ws/subtitles/live` -> Nhận stream text/audio và truyền lại phụ đề dịch thời gian thực cho trình phát video

- [ ] **Step 1: Viết test cho module dịch đa ngôn ngữ**
- [ ] **Step 2: Triển khai API dịch và hỗ trợ subtitle overlay**
- [ ] **Step 3: Chạy test xác nhận**
- [ ] **Step 4: Commit**
  `git add backend/app/routes/subtitles.py backend/app/services/translator.py; git commit -m "feat: real-time subtitle translation engine"`

---

### Task 9: Frontend Setup - React + Vite + Tailwind CSS & App Layout
**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/Header.jsx`
- Create: `frontend/src/components/MobileNav.jsx`

- [ ] **Step 1: Khởi tạo project React + Vite trong `frontend`**
- [ ] **Step 2: Cài đặt Tailwind CSS, Lucide-React, Axios**
- [ ] **Step 3: Thiết lập layout Dark Mode chuyên nghiệp, thanh sidebar cho desktop và thanh bottom nav cho điện thoại**
- [ ] **Step 4: Kiểm thử build frontend: `npm run build`**
- [ ] **Step 5: Commit**
  `git add frontend; git commit -m "feat: modern responsive frontend setup with dark theme"`

---

### Task 10: Frontend UI - Môn học, Điểm số, Ghi chú & Tải Tài liệu
**Files:**
- Create: `frontend/src/pages/AcademicDashboard.jsx`
- Create: `frontend/src/pages/NotesSchedule.jsx`
- Create: `frontend/src/pages/DocumentLibrary.jsx`
- Create: `frontend/src/components/GradeCalculatorModal.jsx`

- [ ] **Step 1: Xây dựng giao diện danh sách môn học, thẻ tín chỉ và biểu đồ GPA trực quan**
- [ ] **Step 2: Xây dựng sổ ghi chú lịch học kèm bộ lọc ngày giờ, deadline có badge trạng thái**
- [ ] **Step 3: Xây dựng giao diện Kho tài liệu với ô nhập link tải tài liệu trực tiếp từ mạng về máy**
- [ ] **Step 4: Kết nối API Backend và kiểm thử thao tác thêm/sửa/xóa**
- [ ] **Step 5: Commit**
  `git add frontend/src/pages/; git commit -m "feat: academic, notes, and document library ui"`

---

### Task 11: Frontend UI - Phòng Ôn Luyện Code (Java, C++, Python)
**Files:**
- Create: `frontend/src/pages/CodePlayground.jsx`
- Create: `frontend/src/components/CodeEditor.jsx`
- Create: `frontend/src/data/codeCheatSheets.js`

- [ ] **Step 1: Tích hợp trình soạn thảo code có highlight cú pháp, chọn ngôn ngữ Java/C++/Python**
- [ ] **Step 2: Nút "Run Code" kết nối trực tiếp đến backend runner với terminal output hiển thị thời gian chạy & kết quả**
- [ ] **Step 3: Thư viện Cheat sheet ôn tập: cú pháp hướng đối tượng Java (Class, Interface, Polymorphism), con trỏ và STL C++, thuật toán tìm kiếm/sắp xếp nạp sẵn 1-click vào trình soạn thảo**
- [ ] **Step 4: Kiểm thử chạy thử code Java và C++ trên giao diện**
- [ ] **Step 5: Commit**
  `git add frontend/src/pages/CodePlayground.jsx; git commit -m "feat: code playground and cheat sheet ui"`

---

### Task 12: Frontend UI - Xưởng Media (Tải video không logo, Lách bản quyền & Tách nền)
**Files:**
- Create: `frontend/src/pages/MediaStudio.jsx`
- Create: `frontend/src/components/VideoDownloader.jsx`
- Create: `frontend/src/components/AntiDuplicateTool.jsx`
- Create: `frontend/src/components/BgRemoverTool.jsx`

- [ ] **Step 1: Xây dựng tab Tải Video: Dán link TikTok/YouTube -> Xem trước thumbnail -> Nút tải chất lượng cao sạch logo**
- [ ] **Step 2: Xây dựng tab Lách Thuật Toán Trùng Lặp: Kéo thả video/ảnh -> Tùy chọn các mức độ lách (Nhẹ / Vừa / Tối đa) -> Bấm xử lý -> Xem và tải video đã đổi hash & fingerprint**
- [ ] **Step 3: Xây dựng tab Tách Nền AI: Upload ảnh -> So sánh trước/sau (Before/After slider) -> Tải ảnh PNG trong suốt**
- [ ] **Step 4: Kiểm thử toàn diện trên giao diện**
- [ ] **Step 5: Commit**
  `git add frontend/src/pages/MediaStudio.jsx; git commit -m "feat: media studio ui for downloader, anti-duplicate and bg remover"`

---

### Task 13: Frontend UI - Tiện ích Thông Minh (Dịch Sub Realtime, Edge-TTS, Flashcards, Pomodoro)
**Files:**
- Create: `frontend/src/pages/SmartUtilities.jsx`
- Create: `frontend/src/components/LiveSubtitlePlayer.jsx`
- Create: `frontend/src/components/TTSGenerator.jsx`
- Create: `frontend/src/components/FlashcardDeck.jsx`
- Create: `frontend/src/components/PomodoroTimer.jsx`

- [ ] **Step 1: Xây dựng trình phát video kèm thanh phụ đề dịch song ngữ chạy theo thời gian thực**
- [ ] **Step 2: Xây dựng bộ tạo giọng đọc AI Edge-TTS với trình nghe thử và nút tải MP3**
- [ ] **Step 3: Xây dựng thẻ ghi nhớ Flashcard có hiệu ứng lật thẻ 3D ôn bài**
- [ ] **Step 4: Xây dựng đồng hồ Pomodoro kèm bộ phát âm thanh tập trung (tiếng mưa rơi, quán cafe, lofi beat)**
- [ ] **Step 5: Commit**
  `git add frontend/src/pages/SmartUtilities.jsx; git commit -m "feat: smart utilities ui with live sub, tts, pomodoro, flashcards"`

---

### Task 14: Mobile PWA, Kết Nối Đa Thiết Bị & Script Khởi Động 1-Click
**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/src/pages/MobileConnect.jsx`
- Create: `start_studymediahub.bat`
- Create: `install_requirements.bat`

- [ ] **Step 1: Cấu hình PWA Manifest và Service Worker để cài đặt được app lên màn hình chính điện thoại**
- [ ] **Step 2: Trang "Kết nối Điện thoại" tự động nhận diện IP máy tính và vẽ mã QR Code lớn để dùng camera điện thoại quét là vào ngay ứng dụng**
- [ ] **Step 3: Tạo file `start_studymediahub.bat` ở thư mục gốc để người dùng chỉ cần click đúp là tự động khởi động cả Backend lẫn Frontend, tự mở trình duyệt**
- [ ] **Step 4: Commit**
  `git add start_studymediahub.bat frontend/public/manifest.json; git commit -m "feat: mobile pwa, qr connect and one-click startup bat"`

---

### Task 15: Kiểm Thử Tích Hợp Toàn Diện (End-to-End Verification)
- [ ] **Step 1: Chạy toàn bộ test suite backend (`pytest backend/tests`)**
- [ ] **Step 2: Build frontend xác nhận không có bất kỳ lỗi cú pháp hay lint nào (`npm run build`)**
- [ ] **Step 3: Kiểm thử toàn bộ luồng chức năng thực tế:**
  - Tạo môn học, nhập điểm -> Kiểm tra GPA tự động.
  - Tạo ghi chú có hẹn ngày giờ.
  - Thử tải một tài liệu trực tuyến về máy.
  - Chạy thử một đoạn mã Java tính toán có `System.out.println`.
  - Tải thử một video không watermark.
  - Xử lý lách trùng lặp một file media và kiểm tra mã MD5 trước/sau.
  - Tạo giọng đọc AI mẫu bằng Edge-TTS.
- [ ] **Step 4: Tạo tài liệu hướng dẫn sử dụng chi tiết `README.md` tại thư mục gốc dự án**
- [ ] **Step 5: Commit hoàn tất**
  `git add .; git commit -m "feat: complete StudyMediaHub fullstack application"`
