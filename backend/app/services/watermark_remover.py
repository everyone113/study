import io
import time
import uuid
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List
import cv2
import numpy as np
from PIL import Image

from app.config import PROCESSED_DIR

def remove_watermark(
    image_bytes: bytes,
    original_filename: str = "image.png",
    mask_bytes: Optional[bytes] = None,
    corner: Optional[str] = None,  # 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'all-corners' | None
    box: Optional[Dict[str, int]] = None,  # {'x': int, 'y': int, 'w': int, 'h': int}
    inpaint_radius: int = 4,
    dilate_radius: int = 5,
    method: str = "telea"  # 'telea' or 'ns'
) -> Dict[str, Any]:
    t0 = time.time()
    stem = Path(original_filename).stem
    out_filename = f"clean_{stem}_{int(time.time())}_{uuid.uuid4().hex[:6]}.png"
    out_path = PROCESSED_DIR / out_filename

    # 1. Decode original image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img_bgr is None:
        raise ValueError("Không thể giải mã dữ liệu hình ảnh")

    has_alpha = False
    alpha_channel = None
    if len(img_bgr.shape) == 3 and img_bgr.shape[2] == 4:
        has_alpha = True
        alpha_channel = img_bgr[:, :, 3]
        img_bgr = img_bgr[:, :, :3]
    elif len(img_bgr.shape) == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)

    h, w = img_bgr.shape[:2]

    # 2. Build or load mask
    mask = np.zeros((h, w), dtype=np.uint8)

    if mask_bytes and len(mask_bytes) > 0:
        mask_nparr = np.frombuffer(mask_bytes, np.uint8)
        loaded_mask = cv2.imdecode(mask_nparr, cv2.IMREAD_GRAYSCALE)
        if loaded_mask is not None:
            if loaded_mask.shape[:2] != (h, w):
                loaded_mask = cv2.resize(loaded_mask, (w, h), interpolation=cv2.INTER_NEAREST)
            # Threshold to clean binary
            _, bin_mask = cv2.threshold(loaded_mask, 15, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_or(mask, bin_mask)

    if box and all(k in box for k in ('x', 'y', 'w', 'h')):
        bx = max(0, min(w - 1, int(box['x'])))
        by = max(0, min(h - 1, int(box['y'])))
        bw = max(1, min(w - bx, int(box['w'])))
        bh = max(1, min(h - by, int(box['h'])))
        mask[by : by + bh, bx : bx + bw] = 255

    # Corner Presets (Default Gemini AI Watermark locations)
    def apply_corner_mask(c_name: str):
        # Gemini watermark is typically ~12% width and ~8% height at the corner with padding
        cw = max(24, int(w * 0.15))
        ch = max(24, int(h * 0.10))
        pad_x = max(8, int(w * 0.015))
        pad_y = max(8, int(h * 0.015))

        if c_name == 'bottom-right':
            x1 = max(0, w - cw - pad_x)
            x2 = min(w, w - pad_x + 8)
            y1 = max(0, h - ch - pad_y)
            y2 = min(h, h - pad_y + 8)
            mask[y1:y2, x1:x2] = 255
        elif c_name == 'bottom-left':
            x1 = max(0, pad_x - 8)
            x2 = min(w, pad_x + cw)
            y1 = max(0, h - ch - pad_y)
            y2 = min(h, h - pad_y + 8)
            mask[y1:y2, x1:x2] = 255
        elif c_name == 'top-right':
            x1 = max(0, w - cw - pad_x)
            x2 = min(w, w - pad_x + 8)
            y1 = max(0, pad_y - 8)
            y2 = min(h, pad_y + ch)
            mask[y1:y2, x1:x2] = 255
        elif c_name == 'top-left':
            x1 = max(0, pad_x - 8)
            x2 = min(w, pad_x + cw)
            y1 = max(0, pad_y - 8)
            y2 = min(h, pad_y + ch)
            mask[y1:y2, x1:x2] = 255

    if corner:
        if corner == 'all-corners':
            for c in ['bottom-right', 'bottom-left', 'top-right', 'top-left']:
                apply_corner_mask(c)
        else:
            apply_corner_mask(corner)
    elif not mask_bytes and not box:
        # Default fallback to bottom-right corner where 99% of Gemini logos appear
        apply_corner_mask('bottom-right')

    # 3. Dilate mask to engulf semi-transparent halos and antialiasing edges
    if dilate_radius > 0:
        k_size = max(3, dilate_radius if dilate_radius % 2 == 1 else dilate_radius + 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
        mask = cv2.dilate(mask, kernel, iterations=1)

    # 4. Inpainting using OpenCV
    inpaint_flag = cv2.INPAINT_TELEA if method.lower() == 'telea' else cv2.INPAINT_NS
    inpaint_r = max(2, min(20, int(inpaint_radius)))

    inpainted_bgr = cv2.inpaint(img_bgr, mask, inpaintRadius=inpaint_r, flags=inpaint_flag)

    # 5. Restore Alpha channel if originally present
    if has_alpha and alpha_channel is not None:
        # Also clean alpha mask if needed
        clean_alpha = alpha_channel.copy()
        clean_alpha[mask == 255] = 255
        final_img = cv2.merge([inpainted_bgr[:, :, 0], inpainted_bgr[:, :, 1], inpainted_bgr[:, :, 2], clean_alpha])
    else:
        final_img = inpainted_bgr

    # 6. Encode to PNG
    success, encoded_buf = cv2.imencode(".png", final_img, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    if not success:
        raise RuntimeError("Không thể mã hóa ảnh sau khi xóa watermark")

    result_bytes = encoded_buf.tobytes()

    # Save to disk
    with open(out_path, "wb") as f:
        f.write(result_bytes)

    # Base64 Data URL for instant browser rendering without server reload delay
    base64_data = base64.b64encode(result_bytes).decode("ascii")
    data_url = f"data:image/png;base64,{base64_data}"

    elapsed = round(time.time() - t0, 2)

    return {
        "status": "success",
        "original_filename": original_filename,
        "result_filename": out_filename,
        "result_url": f"/static/processed/{out_filename}",
        "data_url": data_url,
        "width": w,
        "height": h,
        "elapsed_seconds": elapsed,
        "file_size": len(result_bytes)
    }
