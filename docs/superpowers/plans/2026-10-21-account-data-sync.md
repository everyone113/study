# Triển Khai Cơ Chế Tự Động Đồng Bộ Dữ Liệu Bằng Tài Khoản (Real-time Account Data Sync)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng cơ chế tự động đồng bộ dữ liệu ngầm hai chiều (Real-time Bidirectional Auto-Sync) theo tài khoản người dùng cho toàn bộ dữ liệu học tập (môn học, điểm GPA, ghi chú, tài liệu, flashcards) trên đa thiết bị (Máy tính, Điện thoại) qua Backend Cloud Sync API và P2P WebRTC.

**Architecture:** Mở rộng backend `/api/sync` với endpoint kiểm tra `/api/sync/check` phục vụ polling nhẹ; nâng cấp `AuthContext.jsx` với cơ chế debounced auto-push (1.2s) ngay khi ghi vào Vault, auto-pull khi khởi động ứng dụng và khi chuyển tab (`visibilitychange`); mở rộng P2P WebRTC DataChannel đồng bộ trọn bộ 5 loại dữ liệu; kết nối Flashcards trong `SmartUtilities.jsx` vào Vault người dùng.

**Tech Stack:** FastAPI, SQLite (`aiosqlite`), React 18, Vite, Axios, PeerJS (WebRTC), TailwindCSS, Framer Motion, Pytest.

**Spec:** Yêu cầu người dùng "khi người dùng đăng nhập tài khoản trên máy tính hay điện thoại, dữ liệu (môn học, điểm số GPA, ghi chú, flashcard, v.v.) sẽ tự động đồng bộ ngầm hai chiều theo thời gian thực mỗi khi có chỉnh sửa".

## Global Constraints
- Tất cả các tác vụ và tệp dữ liệu phải nằm hoàn toàn trên ổ `D:\admin\projects\StudyMediaHub`.
- Giao diện, thông báo lỗi/thành công, commit message phải sử dụng tiếng Việt.
- Tương thích ngược: Người dùng chưa đăng nhập (Guest) vẫn lưu cục bộ an toàn, khi đăng nhập sẽ tự động chuyển đổi dữ liệu Guest vào Vault tài khoản.

## Review Focus
1. Đảm bảo xóa sạch danh sách (mảng rỗng `[]`) trên thiết bị A được đồng bộ chính xác sang thiết bị B thay vì bị bỏ qua.
2. Kiểm tra xung đột timestamp giữa local và cloud để không ghi đè dữ liệu mới bằng dữ liệu cũ.
3. Không làm nghẽn mạng: dùng debounce cho thao tác push và endpoint `/check` siêu nhẹ cho thao tác pull.
4. Đảm bảo toàn bộ 22/22 backend tests vượt qua và build frontend không sinh warning.
5. P2P WebRTC gửi đầy đủ 5 trường dữ liệu thay vì chỉ môn học và GPA.

---

### Task 1: Backend Sync API Enhancements
**Files:**
- Modify: `backend/app/routes/sync.py:1-109`
- Test: `backend/tests/test_auth_sync.py`

**Interfaces:**
- Consumes: `app.database.get_db`, `user_sync` table
- Produces: `GET /api/sync/check?user_id=...` -> `{"exists": bool, "updated_at": Optional[str]}`, `POST /api/sync/push` -> `{"success": bool, "updated_at": str}`

- [x] **Step 1: Write test for `/api/sync/check` and push timestamp in `test_auth_sync.py`**
- [x] **Step 2: Run pytest to verify test fails**
- [x] **Step 3: Implement `/api/sync/check` and return `updated_at` in `backend/app/routes/sync.py`**
- [x] **Step 4: Run pytest to verify all tests pass**
- [x] **Step 5: Git commit task 1**

---

### Task 2: Frontend Vault Auto-Sync Engine in AuthContext
**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: `/api/sync/push`, `/api/sync/pull`, `/api/sync/check`, PeerJS
- Produces: `setVaultItem(key, value)` with automatic debounced push, auto-pull on mount & tab focus, complete P2P payload synchronization

- [x] **Step 1: Update `setVaultItem` with debounced auto-push & P2P broadcast**
- [x] **Step 2: Add `checkAndPullIfNewer` and lifecycle listeners (`visibilitychange`, interval heartbeat)**
- [x] **Step 3: Fix `pullCloudData` to allow syncing empty collections and store `cloud_updated_at`**
- [x] **Step 4: Expand PeerJS P2P sync payload to include all 5 collections (subjects, gpa, notes, documents, flashcards)**
- [x] **Step 5: Test frontend build with `npm run build`**
- [x] **Step 6: Git commit task 2**

---

### Task 3: Integrate Flashcards in SmartUtilities with User Vault
**Files:**
- Modify: `frontend/src/pages/SmartUtilities.jsx`

**Interfaces:**
- Consumes: `useAuth` (`getVaultItem`, `setVaultItem`, `currentUser`)
- Produces: Per-user isolated flashcard storage and automatic synchronization

- [x] **Step 1: Connect `SmartUtilities.jsx` to `useAuth()` vault functions for flashcards**
- [x] **Step 2: Update `handleAddCard` and `handleDeleteCard` to update Vault and trigger auto-sync**
- [x] **Step 3: Add `studymedia:user_changed` event listener to reload flashcards when syncing**
- [x] **Step 4: Test frontend build with `npm run build`**
- [x] **Step 5: Git commit task 3**

---

### Task 4: Polish User Interface & Bidirectional Manual Sync
**Files:**
- Modify: `frontend/src/components/UserMenu.jsx`

**Interfaces:**
- Consumes: `AuthContext` sync status, `syncCloudData`, `pullCloudData`
- Produces: Full 2-way sync button with animation and responsive status badge

- [x] **Step 1: Update `handleManualSync` in `UserMenu.jsx` to perform check-pull-then-push bidirectional sync**
- [x] **Step 2: Add visual feedback toast on manual sync completion**
- [x] **Step 3: Test frontend build with `npm run build`**
- [x] **Step 4: Git commit task 4**

---

### Task 5: End-to-End Verification
- [x] **Step 1: Run complete backend pytest suite (`pytest backend/tests -v`)**
- [x] **Step 2: Run frontend production build (`npm run build`)**
- [x] **Step 3: Verify git status and auto-push to repository**
