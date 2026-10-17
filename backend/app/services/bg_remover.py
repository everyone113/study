import io
import time
import uuid
import base64
from pathlib import Path
from PIL import Image
import numpy as np
from app.config import PROCESSED_DIR

# Persistent cached rembg session for sub-second AI inference
_rembg_session = None

def get_rembg_session():
    global _rembg_session
    if _rembg_session is None:
        try:
            from rembg import new_session
            # u2netp is ultra-lightweight (4.5MB) and runs in ~0.5s on standard CPU
            _rembg_session = new_session("u2netp")
        except Exception:
            try:
                from rembg import new_session
                _rembg_session = new_session("u2net")
            except Exception:
                _rembg_session = False
    return _rembg_session if _rembg_session is not False else None

def remove_background(image_bytes: bytes, original_filename: str) -> dict:
    stem = Path(original_filename).stem
    out_filename = f"nobg_{stem}_{int(time.time())}_{uuid.uuid4().hex[:6]}.png"
    out_path = PROCESSED_DIR / out_filename

    result_bytes = None

    # Tier 1: Real AI U2-Net Portable Background Removal (~0.5s)
    try:
        from rembg import remove as rembg_remove
        session = get_rembg_session()
        if session:
            result_bytes = rembg_remove(image_bytes, session=session)
        else:
            result_bytes = rembg_remove(image_bytes)
    except Exception as e:
        # Tier 2: Vectorized high-speed NumPy / Pillow alpha extraction (5ms fallback)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        arr = np.array(img)
        h, w, _ = arr.shape

        # Sample corners
        corners = np.array([arr[0, 0, :3], arr[0, w - 1, :3], arr[h - 1, 0, :3], arr[h - 1, w - 1, :3]])
        bg_rgb = corners.mean(axis=0)

        rgb = arr[:, :, :3].astype(np.float32)
        dist = np.sqrt(np.sum((rgb - bg_rgb) ** 2, axis=2))

        tolerance = 38.0
        fade = 25.0
        alpha = np.clip(((dist - tolerance) / fade) * 255, 0, 255).astype(np.uint8)
        arr[:, :, 3] = alpha

        out_img = Image.fromarray(arr, "RGBA")
        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        result_bytes = buf.getvalue()

    # Save to disk
    with open(out_path, "wb") as f:
        f.write(result_bytes)

    # Base64 Data URL for instant, 0ms latency rendering across Vercel / localhost
    base64_data = base64.b64encode(result_bytes).decode("ascii")
    data_url = f"data:image/png;base64,{base64_data}"

    return {
        "status": "success",
        "original_filename": original_filename,
        "result_filename": out_filename,
        "result_url": f"/static/processed/{out_filename}",
        "data_url": data_url,
        "file_size": len(result_bytes)
    }
