import os
import io
import time
import random
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image, ImageEnhance

from app.config import PROCESSED_DIR

def calculate_file_md5(file_path: Path) -> str:
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def calculate_bytes_md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

def process_image_anti_duplicate(image_bytes: bytes, original_filename: str, mode: str = "smart") -> Dict[str, Any]:
    orig_md5 = calculate_bytes_md5(image_bytes)
    
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # 1. Strip EXIF and metadata by creating a new clean image copy
    clean_img = Image.new(img.mode, img.size)
    clean_img.paste(img)

    # 2. Micro alterations based on mode
    if mode in ["smart", "deep"]:
        # Micro contrast shift (+0.2% to +0.5%)
        enhancer = ImageEnhance.Contrast(clean_img)
        clean_img = enhancer.enhance(1.002)

        # Micro color shift
        color_enhancer = ImageEnhance.Color(clean_img)
        clean_img = color_enhancer.enhance(1.001)

        # Randomize single invisible corner pixel
        width, height = clean_img.size
        if width > 5 and height > 5:
            pixel = clean_img.getpixel((width - 1, height - 1))
            new_pixel = (
                max(0, min(255, pixel[0] + random.choice([-1, 1]))),
                max(0, min(255, pixel[1] + random.choice([-1, 1]))),
                max(0, min(255, pixel[2] + random.choice([-1, 1]))),
            )
            clean_img.putpixel((width - 1, height - 1), new_pixel)

    # 3. Save to output with unique salt
    stem = Path(original_filename).stem
    out_filename = f"antidup_{stem}_{int(time.time())}_{random.randint(100, 999)}.jpg"
    out_path = PROCESSED_DIR / out_filename

    # Save clean image
    clean_img.save(out_path, format="JPEG", quality=95)

    # Append random invisible metadata padding bytes to change container hash
    with open(out_path, "ab") as f:
        f.write(f"\n<!-- StudyMediaHub_Salt_{random.random()} -->".encode("utf-8"))

    new_md5 = calculate_file_md5(out_path)

    return {
        "status": "success",
        "original_filename": original_filename,
        "processed_filename": out_filename,
        "processed_url": f"/static/processed/{out_filename}",
        "original_md5": orig_md5,
        "new_md5": new_md5,
        "file_size": out_path.stat().st_size,
        "applied_tricks": [
            "Tẩy sạch 100% Exif và GPS metadata gốc",
            "Vi chỉnh tương phản 0.2% chống quét ma trận màu",
            "Biến đổi vi mô điểm ảnh biên (pixel shift)",
            "Tạo chữ ký số (MD5/SHA256) hoàn toàn mới"
        ]
    }

def process_video_anti_duplicate(
    input_file_path: Path,
    original_filename: str,
    speed_factor: float = 1.008,
    micro_zoom: bool = True,
    clean_metadata: bool = True,
    audio_pitch_shift: bool = True
) -> Dict[str, Any]:
    orig_md5 = calculate_file_md5(input_file_path)
    stem = Path(original_filename).stem
    out_filename = f"antidup_{stem}_{int(time.time())}_{random.randint(100, 999)}.mp4"
    out_path = PROCESSED_DIR / out_filename

    # Build FFmpeg command filters
    video_filters = []
    audio_filters = []

    # 1. Micro speed alteration
    # Video pts shift
    video_filters.append(f"setpts=PTS/{speed_factor}")
    # Audio tempo
    audio_filters.append(f"atempo={speed_factor}")

    # 2. Micro zoom (crops 2 pixels from edges to change aspect & frame hashing)
    if micro_zoom:
        video_filters.append("crop=in_w-2:in_h-2:1:1,scale=in_w:in_h")

    # Combine filters
    vf_arg = ",".join(video_filters)
    af_arg = ",".join(audio_filters)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_file_path),
        "-vf", vf_arg,
        "-af", af_arg,
        "-c:v", "libx264",
        "-crf", "21",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-map_metadata", "-1", # Strip all metadata
        "-metadata", f"title=REC_{random.randint(100000, 999999)}",
        "-metadata", f"comment=SMH_Gen_{random.randint(1000, 9999)}",
        str(out_path)
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {proc.stderr[:300]}")

    # Append random padding to container
    with open(out_path, "ab") as f:
        f.write(f"\n<!-- SMH_Video_Salt_{random.random()} -->".encode("utf-8"))

    new_md5 = calculate_file_md5(out_path)

    applied_tricks = [
        "Xóa sạch toàn bộ Metadata, thiết bị quay và Exif gốc",
        f"Vi chỉnh tốc độ {speed_factor}x làm thay đổi phổ âm thanh và thời lượng miligiây",
        "Micro zoom nhẹ 2px loại bỏ quét đối xứng khung hình",
        "Re-encode chuẩn x264/AAC với tần số âm thanh 44.1kHz",
        "Thay đổi 100% chữ ký số tệp (MD5, SHA-256) lách bộ lọc quét trùng"
    ]

    return {
        "status": "success",
        "original_filename": original_filename,
        "processed_filename": out_filename,
        "processed_url": f"/static/processed/{out_filename}",
        "original_md5": orig_md5,
        "new_md5": new_md5,
        "file_size": out_path.stat().st_size,
        "applied_tricks": applied_tricks
    }
