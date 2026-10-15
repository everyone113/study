# StudyMediaHub - Personal Student & Media Suite
**Design Specification**
Date: 2026-10-15
Location: `D:\admin\projects\StudyMediaHub`

## 1. Intent & The Why
Sinh viên đại học ngày nay thường phải chuyển qua lại giữa rất nhiều công cụ rời rạc: một app ghi chú thời khóa biểu/điểm số, một IDE nặng nề để gõ vài dòng Java/C++, các website download video TikTok/YouTube đầy quảng cáo rác, các tool online lách bản quyền video hoặc xóa phông ảnh dễ bị đánh cắp dữ liệu hoặc giới hạn lượt dùng.
**StudyMediaHub** là một trạm điều hành tất-cả-trong-một (All-in-one Personal Workstation) hoạt động ngay trên máy tính cá nhân (lưu trữ trên ổ D), cho phép truy cập mượt mà từ cả máy tính và điện thoại.

## 2. Goals, Non-Goals & Anti-Goals
### Goals:
- **Module Học tập & Quản lý Sinh viên:**
  - Quản lý danh sách môn học, số tín chỉ, giảng viên, phòng học, lịch học trong tuần.
  - Quản lý điểm các thành phần (chuyên cần, giữa kỳ, cuối kỳ), tự động tính điểm hệ 10, hệ 4 và điểm chữ (A, B, C, D, F).
  - Sổ ghi chú thông minh theo từng môn học kèm ngày giờ, deadline nộp bài tập và trạng thái hoàn thành.
  - Kho tài liệu học tập: Lưu trữ tài liệu theo môn và công cụ tải file/tài liệu trực tiếp từ bất kỳ liên kết nào trên mạng về máy.
  - Đồng hồ Pomodoro tập trung kết hợp phát nhạc Lofi/tiếng ồn trắng nhẹ nhàng.
  - Flashcard ôn bài (Spaced Repetition) cho các khái niệm, từ vựng và thuật toán.
  - Trình tóm tắt tài liệu & slide bài giảng (PDF / văn bản).

- **Module Ôn luyện Lập trình (Code Lab):**
  - Trình soạn thảo mã nguồn trực quan (CodeMirror / Monaco).
  - Hỗ trợ chạy/biên dịch code Java (thông qua JDK 21 có sẵn trên máy), C++ (g++/local runner hoặc sandbox), Python.
  - Kho cheat sheet & bài tập mẫu ôn luyện cú pháp, hướng đối tượng (OOP), cấu trúc dữ liệu.

- **Module Sáng tạo Media & Lách Bản Quyền MXH (Media Studio):**
  - Tải video TikTok & YouTube (Shorts/Videos) độ nét cao, loại bỏ hoàn toàn watermark/logo.
  - Bộ công cụ lách thuật toán quét trùng lặp trên mạng xã hội (TikTok, Facebook Reels, Shorts):
    - Đổi mã băm tệp (MD5, SHA-256).
    - Xóa sạch metadata / Exif và ghi đè metadata giả lập thiết bị ngẫu nhiên.
    - Can thiệp vi mô vào video (chỉnh bitrate, vi chỉnh tốc độ 1.005x, vi lật nhẹ 0.2%, thêm micro-noise vô hình cho mắt người, thay đổi tần số audio nhẹ) mà không làm suy giảm chất lượng nhìn thấy.
    - Công cụ tương tự cho hình ảnh (đổi pixel băm, xóa Exif).
  - Tách nền vật thể / người trong ảnh (AI Background Removal) sử dụng mô hình AI chạy trực tiếp hoặc API xử lý sạch sẽ.
  - Trình nén & chuyển đổi định dạng video / audio / ảnh siêu tốc bằng FFmpeg (đã có sẵn trên máy).
  - Bộ tạo giọng đọc AI (Text-to-Speech) tự nhiên đa ngôn ngữ (tiếng Việt, tiếng Anh) thông qua Edge-TTS chất lượng cao.

- **Module Trợ lý Thời gian thực (Real-time Live Subtitles):**
  - Hỗ trợ xem video / phim trên web có phụ đề dịch song ngữ hiển thị đè theo thời gian thực (Live caption / subtitle translator).

- **Khả năng Đa thiết bị (PC & Điện thoại):**
  - Giao diện Responsive Web / PWA: trên desktop là dashboard rộng rãi, trên điện thoại hiển thị như ứng dụng native với thanh điều hướng đáy.
  - Hướng dẫn kết nối qua Wi-Fi nội bộ kèm mã QR và hỗ trợ tunnel (Cloudflare Tunnel) để truy cập từ 4G bên ngoài.

### Non-Goals:
- Không xây dựng mạng xã hội hoặc hệ thống multi-tenant phức tạp; đây là ứng dụng trạm điều hành phục vụ nhu cầu cá nhân của người dùng trên chính máy tính của họ.
- Không phụ thuộc vào các dịch vụ đám mây trả phí bắt buộc.

### Anti-Goals:
- Không chèn quảng cáo, popup hoặc thu thập dữ liệu cá nhân.
- Không làm giao diện cồng kềnh, tải chậm; tối ưu tốc độ phản hồi < 100ms cho các thao tác học tập thông thường.

## 3. Tech Stack & Architecture
- **Backend:** Python FastAPI + Uvicorn
  - Thư viện: `yt-dlp` (tải video), `ffmpeg-python` (xử lý video/audio), `edge-tts` (giọng đọc AI), `Pillow` (xử lý ảnh), `rembg` / `onnxruntime` (tách nền), `sqlite3` / `aiosqlite` (database lưu trữ điểm, môn học, note, flashcard).
- **Frontend:** React + Vite + Tailwind CSS + Lucide Icons
  - PWA hỗ trợ cài đặt trên điện thoại và máy tính.
  - Trình soạn thảo code tích hợp, Audio/Video player có subtitle overlay.
- **Vị trí lưu trữ:**
  - Dự án: `D:\admin\projects\StudyMediaHub`
  - Cơ sở dữ liệu: `D:\admin\projects\StudyMediaHub\backend\data\studymedia.db`
  - Thư mục tải về / media: `D:\admin\projects\StudyMediaHub\backend\downloads`

## 4. Giao diện & Trải nghiệm Người dùng
- Theme tối hiện đại (Modern Dark UI) kết hợp các điểm nhấn màu sắc theo từng phân khu (Học tập: Xanh dương / Ngọc bích, Media: Tím / Hồng, Code: Cam / Hổ phách).
- Bố cục Dashboard tabbed:
  1. `Tổng quan (Dashboard)`
  2. `Môn học & Điểm số (Academic)`
  3. `Ghi chú & Lịch trình (Notes & Tasks)`
  4. `Kho tài liệu (Library & Downloader)`
  5. `Phòng Code (Code Playground)`
  6. `Media Studio (Tải video, Tách nền, Lách bản quyền)`
  7. `Tiện ích thông minh (Dịch phụ đề realtime, TTS, Flashcard, Pomodoro, AI Tóm tắt)`
  8. `Kết nối di động (Mobile Connect & Settings)`
