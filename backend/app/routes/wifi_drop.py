import os
import re
import socket
import time
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from app.config import DROP_DIR, FRONTEND_PORT, PORT

router = APIRouter(prefix="/api/drop", tags=["WiFi Drop"])

class DropTextPayload(BaseModel):
    text: str
    title: Optional[str] = None

def get_all_local_ips() -> List[str]:
    """Detect all active IP addresses, prioritizing real Wi-Fi/LAN (192.168.x.x)."""
    ips = []
    # 1. From gethostbyname_ex
    try:
        host_ips = socket.gethostbyname_ex(socket.gethostname())[2]
        for ip in host_ips:
            if not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    # 2. From UDP socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        connected_ip = s.getsockname()[0]
        s.close()
        if connected_ip not in ips and not connected_ip.startswith("127."):
            ips.append(connected_ip)
    except Exception:
        pass

    # Sort priorities: 192.168.x.x (typical Wi-Fi) > 10.x.x.x > others; 26.x (Radmin VPN) last
    def priority(ip: str):
        if ip.startswith("192.168."):
            return 1
        if ip.startswith("10."):
            return 2
        if ip.startswith("172."):
            return 3
        if ip.startswith("26."):  # Radmin VPN
            return 99
        return 10

    ips.sort(key=priority)
    return ips

def get_local_ip() -> str:
    ips = get_all_local_ips()
    return ips[0] if ips else "127.0.0.1"

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_file_type(extension: str) -> str:
    ext = extension.lower().lstrip(".")
    if ext in ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif"]:
        return "image"
    elif ext in ["mp4", "mov", "avi", "mkv", "webm", "m4v"]:
        return "video"
    elif ext in ["mp3", "wav", "m4a", "flac", "aac", "ogg"]:
        return "audio"
    elif ext in ["txt", "md", "json", "log", "text"]:
        return "text"
    elif ext in ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar"]:
        return "document"
    return "other"

@router.get("/network-info")
async def get_network_info():
    """Returns local LAN IP, port, all detected IPs, and direct mobile upload URL for QR code."""
    all_ips = get_all_local_ips()
    ip = all_ips[0] if all_ips else "127.0.0.1"
    return {
        "local_ip": ip,
        "all_ips": all_ips,
        "frontend_port": FRONTEND_PORT,
        "backend_port": PORT,
        "upload_url": f"http://{ip}:{FRONTEND_PORT}/?mode=drop"
    }

@router.get("/files")
async def list_dropped_files():
    """List all files transferred via WiFi Drop, newest first."""
    files = []
    if not DROP_DIR.exists():
        return []

    for entry in DROP_DIR.iterdir():
        if entry.is_file():
            stat = entry.stat()
            ext = entry.suffix.lower()
            file_type = get_file_type(ext)
            # Parse original name from timestamp_prefix_name
            name_parts = entry.name.split("_", 2)
            display_name = name_parts[-1] if len(name_parts) >= 3 else entry.name

            text_content = ""
            is_link = False
            if file_type == "text" and stat.st_size < 100000:
                try:
                    with open(entry, "r", encoding="utf-8", errors="ignore") as tf:
                        text_content = tf.read()
                        is_link = text_content.startswith("http://") or text_content.startswith("https://")
                except Exception:
                    pass

            files.append({
                "id": entry.name,
                "filename": entry.name,
                "display_name": display_name,
                "size": stat.st_size,
                "size_formatted": f"{len(text_content)} ký tự" if file_type == "text" and text_content else format_size(stat.st_size),
                "modified_at": stat.st_mtime,
                "url": f"/static/wifidrop/{entry.name}",
                "file_type": file_type,
                "extension": ext.lstrip("."),
                "text_content": text_content,
                "is_link": is_link
            })

    # Sort descending by modified time
    files.sort(key=lambda x: x["modified_at"], reverse=True)
    return files

@router.post("/upload")
async def upload_dropped_files(files: List[UploadFile] = File(...)):
    """Upload one or multiple photos/files from phone or PC over WiFi."""
    if not files:
        raise HTTPException(status_code=400, detail="Không có tệp nào được chọn")

    saved_files = []
    timestamp = int(time.time() * 1000)

    for idx, file in enumerate(files):
        # Sanitize filename
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename or f"photo_{idx}.jpg")
        stored_filename = f"drop_{timestamp}_{idx}_{clean_name}"
        dest_path = DROP_DIR / stored_filename

        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)

        ext = dest_path.suffix.lower()
        saved_files.append({
            "id": stored_filename,
            "filename": stored_filename,
            "display_name": file.filename or clean_name,
            "size": len(content),
            "size_formatted": format_size(len(content)),
            "url": f"/static/wifidrop/{stored_filename}",
            "file_type": get_file_type(ext),
            "extension": ext.lstrip(".")
        })

    return {
        "status": "success",
        "message": f"Đã chuyển thành công {len(saved_files)} tệp qua Wi-Fi",
        "files": saved_files
    }

@router.post("/text")
async def upload_dropped_text(payload: DropTextPayload):
    """Drop text, notes, or links from phone or PC over WiFi."""
    text = payload.text.strip() if payload.text else ""
    if not text:
        raise HTTPException(status_code=400, detail="Nội dung văn bản không được để trống")

    timestamp = int(time.time() * 1000)
    is_link = text.startswith("http://") or text.startswith("https://")
    first_line = text.split("\n")[0].strip()
    raw_title = payload.title.strip() if payload.title and payload.title.strip() else first_line[:30]
    clean_title = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_title)[:40].strip('_') or "text_drop"
    stored_filename = f"drop_{timestamp}_0_{clean_title}.txt"
    dest_path = DROP_DIR / stored_filename

    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(text)

    stat = dest_path.stat()
    item = {
        "id": stored_filename,
        "filename": stored_filename,
        "display_name": f"{raw_title}.txt" if not raw_title.endswith(".txt") else raw_title,
        "size": stat.st_size,
        "size_formatted": f"{len(text)} ký tự",
        "modified_at": stat.st_mtime,
        "url": f"/static/wifidrop/{stored_filename}",
        "file_type": "text",
        "extension": "txt",
        "text_content": text,
        "is_link": is_link
    }

    return {
        "status": "success",
        "message": "Đã chia sẻ văn bản qua Wi-Fi thành công",
        "file": item
    }

@router.delete("/files/{filename}")
async def delete_dropped_file(filename: str):
    """Delete a single dropped file safely."""
    # Prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Tên tệp không hợp lệ")

    target = DROP_DIR / filename
    if target.exists() and target.is_file():
        target.unlink()
        return {"status": "success", "message": f"Đã xóa tệp {filename}"}
    raise HTTPException(status_code=404, detail="Không tìm thấy tệp")

@router.delete("/clear")
async def clear_all_dropped_files():
    """Clear all transferred files in WiFi Drop folder."""
    count = 0
    if DROP_DIR.exists():
        for item in DROP_DIR.iterdir():
            if item.is_file():
                try:
                    item.unlink()
                    count += 1
                except Exception:
                    pass
    return {"status": "success", "message": f"Đã dọn dẹp {count} tệp"}

def get_mobile_drop_html(local_ip: str, port: int, frontend_port: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>WiFi Drop - StudyMediaHub</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
    body {{ background: #090d16; color: #f1f5f9; padding: 16px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }}
    .wrap {{ width: 100%; max-width: 440px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }}
    .badge {{ display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; width: fit-content; border: 1px solid rgba(16, 185, 129, 0.3); }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }}
    @keyframes pulse {{ 0%, 100% {{ opacity: 1; transform: scale(1); }} 50% {{ opacity: 0.5; transform: scale(0.85); }} }}
    .card {{ background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
    h1 {{ font-size: 20px; font-weight: 900; color: #fff; margin-top: 6px; }}
    p.sub {{ font-size: 13px; color: #94a3b8; margin-top: 4px; line-height: 1.4; }}
    .tabs {{ display: flex; background: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 4px; margin-top: 14px; gap: 4px; }}
    .tab-btn {{ flex: 1; border: none; outline: none; background: transparent; color: #94a3b8; padding: 10px 6px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; }}
    .tab-btn.active {{ background: #059669; color: #fff; box-shadow: 0 4px 12px rgba(5,150,105,0.4); }}
    .picker-btn {{ width: 100%; border: 2px dashed #10b981; background: rgba(16, 185, 129, 0.05); border-radius: 20px; padding: 26px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-align: center; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }}
    .picker-btn:active {{ transform: scale(0.98); background: rgba(16, 185, 129, 0.15); }}
    .icon-box {{ width: 56px; height: 56px; border-radius: 16px; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.35); }}
    .picker-title {{ font-size: 15px; font-weight: 800; color: #fff; }}
    .picker-sub {{ font-size: 12px; color: #94a3b8; }}
    .text-area-box {{ display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }}
    textarea {{ width: 100%; height: 120px; background: #020617; border: 1px solid #334155; border-radius: 16px; padding: 12px; color: #fff; font-size: 13px; resize: none; outline: none; }}
    textarea:focus {{ border-color: #10b981; }}
    .paste-btn {{ align-self: flex-start; background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; }}
    .preview-box {{ display: none; background: #020617; border: 1px solid #1e293b; border-radius: 18px; padding: 14px; flex-direction: column; gap: 12px; margin-top: 14px; }}
    .preview-header {{ display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: #cbd5e1; }}
    .preview-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 180px; overflow-y: auto; }}
    .preview-grid img {{ width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; border: 1px solid #334155; }}
    .send-btn {{ width: 100%; border: none; outline: none; padding: 16px; border-radius: 16px; background: linear-gradient(135deg, #10b981, #0d9488); color: #fff; font-size: 15px; font-weight: 900; cursor: pointer; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }}
    .send-btn:active {{ transform: scale(0.98); }}
    .send-btn:disabled {{ opacity: 0.6; pointer-events: none; }}
    .progress-bar {{ width: 100%; height: 8px; background: #1e293b; border-radius: 9999px; overflow: hidden; display: none; }}
    .progress-fill {{ width: 0%; height: 100%; background: #10b981; transition: width 0.15s ease; }}
    .alert-success {{ display: none; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 14px; border-radius: 16px; font-size: 13px; font-weight: 700; align-items: center; gap: 8px; margin-top: 12px; }}
    .pc-files-box {{ margin-top: 16px; }}
    .pc-file-item {{ display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #020617; border: 1px solid #1e293b; border-radius: 12px; margin-top: 8px; font-size: 12px; }}
    .pc-file-name {{ font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }}
    .actions-row {{ display: flex; gap: 6px; }}
    .dl-btn {{ background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 10px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 11px; cursor: pointer; }}
    .copy-btn {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; }}
    .footer-link {{ text-align: center; margin-top: 12px; font-size: 12px; color: #64748b; }}
    .footer-link a {{ color: #38bdf8; text-decoration: none; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="badge">
        <span class="dot"></span>
        <span>Wi-Fi Cục Bộ • Đã Kết Nối PC ({local_ip})</span>
      </div>
      <h1>WiFi Drop Siêu Tốc</h1>
      <p class="sub">Chia sẻ nhanh ảnh, video hoặc văn bản, ghi chú, đường link sang máy tính tức thì.</p>

      <div class="tabs">
        <button class="tab-btn active" id="tabFilesBtn" onclick="switchTab('files')">📸 Ảnh & Tệp</button>
        <button class="tab-btn" id="tabTextBtn" onclick="switchTab('text')">📝 Văn Bản & Link</button>
      </div>

      <!-- TAB 1: FILES -->
      <div id="tabFilesSection" style="margin-top: 14px;">
        <input type="file" id="filePicker" multiple accept="image/*,video/*,application/pdf" style="display:none">
        <div class="picker-btn" id="pickerBtn" onclick="document.getElementById('filePicker').click()">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
          <div>
            <div class="picker-title" id="pickerLabel">📸 Chạm Để Mở Kho Ảnh / Album</div>
            <div class="picker-sub">Hỗ trợ chọn nhiều ảnh JPG, PNG, Video MP4</div>
          </div>
        </div>

        <div class="preview-box" id="previewBox">
          <div class="preview-header">
            <span id="previewCount">Đã chọn 0 ảnh</span>
            <span id="previewSize" style="color:#34d399;font-family:monospace;">0 MB</span>
          </div>
          <div class="preview-grid" id="previewGrid"></div>
          <button class="send-btn" id="sendBtn" onclick="uploadFiles()">
            <span>🚀 BẮN LÊN MÁY TÍNH NGAY</span>
          </button>
          <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
        </div>
      </div>

      <!-- TAB 2: TEXT -->
      <div id="tabTextSection" style="display: none;">
        <div class="text-area-box">
          <button type="button" class="paste-btn" onclick="pasteFromClipboard()">📋 Dán từ Clipboard</button>
          <textarea id="textDropInput" placeholder="Dán hoặc gõ văn bản, ghi chú, mã code hoặc đường link cần bắn sang PC..."></textarea>
          <button class="send-btn" id="sendTextBtn" onclick="uploadText()">
            <span>🚀 BẮN VĂN BẢN SANG PC</span>
          </button>
        </div>
      </div>

      <div class="alert-success" id="alertSuccess">
        <span>✅ Đã bắn thành công lên máy tính!</span>
      </div>

      <div class="pc-files-box" id="pcFilesBox" style="display:none;">
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-top:16px;letter-spacing:0.5px;">
          Tệp & Văn bản trên máy tính:
        </div>
        <div id="pcFilesList"></div>
      </div>
    </div>

    <div class="footer-link">
      Cần dùng máy tính? <a href="http://{local_ip}:{frontend_port}">Mở hệ thống StudyMediaHub</a>
    </div>
  </div>

  <script>
    let currentMode = 'files';
    let selectedFiles = [];
    const filePicker = document.getElementById('filePicker');
    const previewBox = document.getElementById('previewBox');
    const previewGrid = document.getElementById('previewGrid');
    const previewCount = document.getElementById('previewCount');
    const previewSize = document.getElementById('previewSize');
    const sendBtn = document.getElementById('sendBtn');
    const sendTextBtn = document.getElementById('sendTextBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const alertSuccess = document.getElementById('alertSuccess');
    const pickerLabel = document.getElementById('pickerLabel');
    const textDropInput = document.getElementById('textDropInput');

    function switchTab(mode) {{
      currentMode = mode;
      alertSuccess.style.display = 'none';
      if (mode === 'files') {{
        document.getElementById('tabFilesBtn').classList.add('active');
        document.getElementById('tabTextBtn').classList.remove('active');
        document.getElementById('tabFilesSection').style.display = 'block';
        document.getElementById('tabTextSection').style.display = 'none';
      }} else {{
        document.getElementById('tabFilesBtn').classList.remove('active');
        document.getElementById('tabTextBtn').classList.add('active');
        document.getElementById('tabFilesSection').style.display = 'none';
        document.getElementById('tabTextSection').style.display = 'block';
      }}
    }}

    async function pasteFromClipboard() {{
      try {{
        if (navigator.clipboard && navigator.clipboard.readText) {{
          const t = await navigator.clipboard.readText();
          if (t) textDropInput.value = t;
        }}
      }} catch (e) {{}}
    }}

    function uploadText() {{
      const val = textDropInput.value.trim();
      if (!val) return alert('Vui lòng nhập hoặc dán nội dung văn bản!');

      sendTextBtn.disabled = true;
      sendTextBtn.innerText = 'Đang bắn sang PC...';

      fetch('/api/drop/text', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ text: val }})
      }})
      .then(r => r.json())
      .then(data => {{
        sendTextBtn.disabled = false;
        sendTextBtn.innerText = '🚀 BẮN VĂN BẢN SANG PC';
        if (data.status === 'success') {{
          if (navigator.vibrate) navigator.vibrate(60);
          alertSuccess.style.display = 'flex';
          alertSuccess.innerText = '✅ Đã bắn văn bản lên máy tính thành công!';
          textDropInput.value = '';
          loadPcFiles();
        }} else {{
          alert(data.detail || 'Lỗi khi gửi văn bản');
        }}
      }})
      .catch(err => {{
        sendTextBtn.disabled = false;
        sendTextBtn.innerText = '🚀 BẮN VĂN BẢN SANG PC';
        alert('Không thể kết nối tới máy tính');
      }});
    }}

    filePicker.addEventListener('change', function(e) {{
      selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length === 0) return;

      alertSuccess.style.display = 'none';
      previewBox.style.display = 'flex';
      previewGrid.innerHTML = '';
      pickerLabel.innerText = 'Đã chọn ' + selectedFiles.length + ' tệp (Chạm để đổi)';

      let totalBytes = 0;
      selectedFiles.forEach((file, idx) => {{
        totalBytes += file.size;
        if (file.type.startsWith('image/')) {{
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          previewGrid.appendChild(img);
        }} else {{
          const div = document.createElement('div');
          div.style.cssText = 'aspect-ratio:1;background:#1e293b;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;font-weight:700;';
          div.innerText = file.name.slice(-4);
          previewGrid.appendChild(div);
        }}
      }});

      previewCount.innerText = 'Đã chọn ' + selectedFiles.length + ' tệp';
      previewSize.innerText = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
    }});

    function uploadFiles() {{
      if (selectedFiles.length === 0) return;
      sendBtn.disabled = true;
      sendBtn.innerText = 'Đang bắn qua Wi-Fi...';
      progressBar.style.display = 'block';
      progressFill.style.width = '0%';

      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/drop/upload');

      xhr.upload.onprogress = function(e) {{
        if (e.lengthComputable) {{
          const p = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = p + '%';
          sendBtn.innerText = 'Đang bắn qua Wi-Fi (' + p + '%)...';
        }}
      }};

      xhr.onload = function() {{
        sendBtn.disabled = false;
        sendBtn.innerText = '🚀 BẮN LÊN MÁY TÍNH NGAY';
        if (xhr.status === 200) {{
          if (navigator.vibrate) navigator.vibrate(60);
          alertSuccess.style.display = 'flex';
          alertSuccess.innerText = '✅ Đã bắn ' + selectedFiles.length + ' tệp lên máy tính thành công!';
          previewBox.style.display = 'none';
          filePicker.value = '';
          pickerLabel.innerText = '📸 Chạm Để Chọn Thêm Ảnh Khác';
          loadPcFiles();
        }} else {{
          alert('Lỗi khi tải tệp: ' + xhr.responseText);
        }}
      }};

      xhr.onerror = function() {{
        sendBtn.disabled = false;
        sendBtn.innerText = '🚀 Thử Lại';
        alert('Không thể kết nối tới máy tính. Vui lòng kiểm tra Wi-Fi.');
      }};

      xhr.send(formData);
    }}

    function copyContent(text) {{
      navigator.clipboard.writeText(text).then(() => {{
        alert('Đã sao chép nội dung văn bản!');
      }}).catch(() => {{
        prompt('Sao chép thủ công:', text);
      }});
    }}

    function loadPcFiles() {{
      fetch('/api/drop/files')
        .then(r => r.json())
        .then(files => {{
          if (!files || files.length === 0) return;
          const box = document.getElementById('pcFilesBox');
          const list = document.getElementById('pcFilesList');
          box.style.display = 'block';
          list.innerHTML = '';
          files.slice(0, 8).forEach(f => {{
            const item = document.createElement('div');
            item.className = 'pc-file-item';
            let actions = '<div class="actions-row">';
            if (f.file_type === 'text' && f.text_content) {{
              actions += '<button class="copy-btn" onclick="copyContent(' + JSON.stringify(f.text_content) + ')">📋 Sao chép</button>';
              if (f.is_link) {{
                actions += '<a class="dl-btn" href="' + f.text_content + '" target="_blank">🔗 Mở link</a>';
              }}
            }}
            actions += '<a class="dl-btn" href="' + f.url + '" download>Tải về</a></div>';

            item.innerHTML = '<span class="pc-file-name">' + (f.file_type === 'text' ? '📝 ' : '📁 ') + f.display_name + '</span>' + actions;
            list.appendChild(item);
          }});
        }}).catch(() => {{}});
    }}
    loadPcFiles();
  </script>
</body>
</html>"""

@router.get("/portal", response_class=HTMLResponse)
async def get_wifi_drop_portal():
    """Ultra-fast standalone 0ms mobile uploader page."""
    ip = get_local_ip()
    return HTMLResponse(get_mobile_drop_html(ip, PORT, FRONTEND_PORT))
