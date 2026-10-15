import io
import time
import uuid
from pathlib import Path
from PIL import Image
from app.config import PROCESSED_DIR

def remove_background(image_bytes: bytes, original_filename: str) -> dict:
    stem = Path(original_filename).stem
    out_filename = f"nobg_{stem}_{int(time.time())}_{uuid.uuid4().hex[:6]}.png"
    out_path = PROCESSED_DIR / out_filename

    # Try rembg if available, otherwise fast Pillow color-keying
    try:
        from rembg import remove as rembg_remove
        result_bytes = rembg_remove(image_bytes)
        img = Image.open(io.BytesIO(result_bytes))
    except Exception:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # Sample background color from the four corners
        corners = [
            pixels[0, 0],
            pixels[width - 1, 0],
            pixels[0, height - 1],
            pixels[width - 1, height - 1]
        ]
        bg_r = sum(c[0] for c in corners) / 4.0
        bg_g = sum(c[1] for c in corners) / 4.0
        bg_b = sum(c[2] for c in corners) / 4.0

        tolerance = 40.0
        for x in range(width):
            for y in range(height):
                r, g, b, a = pixels[x, y]
                dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
                if dist < tolerance:
                    pixels[x, y] = (255, 255, 255, 0)
                elif dist < tolerance + 25.0:
                    alpha = int(((dist - tolerance) / 25.0) * 255)
                    pixels[x, y] = (r, g, b, alpha)

    img.save(out_path, format="PNG")

    return {
        "status": "success",
        "original_filename": original_filename,
        "result_filename": out_filename,
        "result_url": f"/static/processed/{out_filename}",
        "file_size": out_path.stat().st_size
    }
