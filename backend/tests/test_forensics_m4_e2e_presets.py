"""Empirical End-to-End Presets Integration Test for Photo Forensics Studio (Milestone 4).

Adversarially written and executed by Final E2E Challenger to verify:
1. Direct synthesis of the 5 visual presets defined in frontend `samplePresets.js`.
2. Interaction of these synthetic payloads with `/api/forensics/analyze`, `/api/forensics/ela`, and `/api/forensics/suncalc`.
3. Validation of response schemas, cryptographic hashes, ELA heatmaps, and NOAA celestial mechanics.
"""

import base64
import io
import math
from datetime import date
from typing import Dict, Any, Tuple

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image, ImageDraw, ImageFont

from app.main import app


# ===========================================================================
# Synthetic Preset Generators Matching frontend/src/components/Forensics/samplePresets.js
# ===========================================================================

def generate_preset_benthanh() -> Tuple[bytes, str]:
    """Preset 1: Chợ Bến Thành (EXIF & GPS) - DSC04892_BenThanh_HCMC.jpg"""
    w, h = 800, 600
    img = Image.new("RGB", (w, h), color=(186, 230, 253))
    draw = ImageDraw.Draw(img)
    # Sky gradient
    for y in range(int(h * 0.6)):
        r = int(2 + (y / (h * 0.6)) * 184)
        g = int(132 + (y / (h * 0.6)) * 98)
        b = int(199 + (y / (h * 0.6)) * 54)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    # Plaza ground
    draw.rectangle([(0, int(h * 0.6)), (w, h)], fill=(40, 50, 65))
    # Clock tower facade
    draw.rectangle([(int(w * 0.35), int(h * 0.25)), (int(w * 0.65), int(h * 0.70))], fill=(254, 240, 138))
    # Pyramid roof
    draw.polygon([(int(w * 0.32), int(h * 0.25)), (int(w * 0.50), int(h * 0.10)), (int(w * 0.68), int(h * 0.25))], fill=(220, 38, 38))
    # Clock circle
    draw.ellipse([(int(w * 0.44), int(h * 0.29)), (int(w * 0.56), int(h * 0.41))], fill=(255, 255, 255), outline=(15, 23, 42), width=3)
    # Clock hands ~11:35
    draw.line([(int(w * 0.50), int(h * 0.35)), (int(w * 0.49), int(h * 0.31))], fill=(15, 23, 42), width=2)
    draw.line([(int(w * 0.50), int(h * 0.35)), (int(w * 0.53), int(h * 0.38))], fill=(15, 23, 42), width=2)
    # Watermark text
    draw.text((20, h - 30), "Ben Thanh Market, HCMC (10.7725 N, 106.6980 E) - Sony A7R IV", fill=(255, 255, 255))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue(), "DSC04892_BenThanh_HCMC.jpg"


def generate_preset_ela_anomaly() -> Tuple[bytes, str]:
    """Preset 2: Biển Số Ghép (Dị Thường ELA) - tampered_license_plate_59P1.jpg"""
    w, h = 800, 600
    # Create background pre-compressed at Q=70
    bg = Image.new("RGB", (w, h), color=(15, 23, 42))
    draw_bg = ImageDraw.Draw(bg)
    # Motorbike rear silhouette
    draw_bg.rectangle([(int(w * 0.2), int(h * 0.15)), (int(w * 0.8), int(h * 0.85))], fill=(30, 41, 59))
    # Plate bracket
    draw_bg.rectangle([(int(w * 0.28), int(h * 0.35)), (int(w * 0.72), int(h * 0.67))], fill=(9, 13, 22), outline=(51, 65, 85), width=4)
    # Plate surface
    draw_bg.rectangle([(int(w * 0.30), int(h * 0.37)), (int(w * 0.70), int(h * 0.65))], fill=(248, 250, 252))
    # Authentic text "59 - P1"
    draw_bg.text((int(w * 0.42), int(h * 0.42)), "59 - P1", fill=(15, 23, 42))

    buf_bg = io.BytesIO()
    bg.save(buf_bg, format="JPEG", quality=70)
    bg_loaded = Image.open(io.BytesIO(buf_bg.getvalue()))

    # Spliced composite: high contrast sharp uncompressed block "999.99"
    stamp = Image.new("RGB", (int(w * 0.36), int(h * 0.12)), color=(248, 250, 252))
    draw_stamp = ImageDraw.Draw(stamp)
    draw_stamp.text((10, 10), "999.99 [SPLICE]", fill=(0, 0, 0))
    # Add noise in stamp to maximize difference
    for sy in range(stamp.height):
        for sx in range(stamp.width):
            if (sx % 6 == 0) and (sy % 6 == 0):
                stamp.putpixel((sx, sy), (0, 0, 0))

    spliced = bg_loaded.copy()
    spliced.paste(stamp, (int(w * 0.32), int(h * 0.50)))

    buf_final = io.BytesIO()
    spliced.save(buf_final, format="JPEG", quality=85)
    return buf_final.getvalue(), "tampered_license_plate_59P1.jpg"


def generate_preset_solar_shadow() -> Tuple[bytes, str]:
    """Preset 3: Cột Cờ & Bóng Đổ (Chrono-Solar) - flagpole_shadow_hanoi_205deg.jpg"""
    w, h = 800, 600
    img = Image.new("RGB", (w, h), color=(120, 130, 145))
    draw = ImageDraw.Draw(img)
    # Courtyard paving lines
    for x in range(0, w, 40):
        draw.line([(x, 0), (x, h)], fill=(140, 150, 165))
    for y in range(0, h, 40):
        draw.line([(0, y), (w, y)], fill=(140, 150, 165))

    base_x = int(w * 0.55)
    base_y = int(h * 0.35)
    shadow_angle_deg = 205.0
    shadow_length = h * 0.45
    # Shadow vector
    rad = math.radians(shadow_angle_deg - 90.0)
    tip_x = int(base_x + math.cos(rad) * shadow_length)
    tip_y = int(base_y + math.sin(rad) * shadow_length)

    # Shadow polygon
    draw.polygon([(base_x - 8, base_y), (tip_x - 3, tip_y), (tip_x + 3, tip_y), (base_x + 8, base_y)], fill=(15, 23, 42))
    draw.ellipse([(tip_x - 15, tip_y - 15), (tip_x + 15, tip_y + 15)], fill=(15, 23, 42))
    # Pedestal & flagpole
    draw.ellipse([(base_x - 24, base_y - 24), (base_x + 24, base_y + 24)], fill=(71, 85, 105))
    draw.ellipse([(base_x - 8, base_y - 8), (base_x + 8, base_y + 8)], fill=(248, 250, 252))

    draw.text((20, h - 30), "Hanoi Flagpole (21.0313 N, 105.8402 E) - Shadow angle 205 deg", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue(), "flagpole_shadow_hanoi_205deg.jpg"


def generate_preset_fb_fingerprint() -> Tuple[bytes, str]:
    """Preset 4: Facebook CDN Hash (Fingerprint) - 1021482910398402_2049182049182049_1715783400_n.jpg"""
    raw_bytes, _ = generate_preset_benthanh()
    filename = "1021482910398402_2049182049182049_1715783400_n.jpg"
    return raw_bytes, filename


def generate_preset_micro_text() -> Tuple[bytes, str]:
    """Preset 5: Hồ Sơ Giám Định & Chữ Vi Mô - forensics_case_dossier_microtext.png"""
    w, h = 800, 600
    img = Image.new("RGB", (w, h), color=(69, 26, 3))
    draw = ImageDraw.Draw(img)
    # Receipt paper
    draw.rectangle([(int(w * 0.22), int(h * 0.08)), (int(w * 0.78), int(h * 0.92))], fill=(254, 252, 232))
    # Receipt header & text
    draw.text((int(w * 0.30), int(h * 0.15)), "TRUNG TAM GIAM DINH TU PHAP", fill=(30, 41, 59))
    draw.text((int(w * 0.26), int(h * 0.30)), "MA HO SO:     FSS-2024-9988-VN", fill=(30, 41, 59))
    draw.text((int(w * 0.26), int(h * 0.35)), "NGAY THU LY:  15/05/2024 14:30:00", fill=(30, 41, 59))
    draw.text((int(w * 0.26), int(h * 0.40)), "DOI TUONG:    TAI LIEU KY THUAT SO", fill=(30, 41, 59))
    draw.text((int(w * 0.26), int(h * 0.50)), "SERIAL CHIP: 8A4F-99B2-C019-E441-FF02", fill=(100, 116, 139))
    # Barcode
    for bx in range(int(w * 0.26), int(w * 0.74), 4):
        bw = 3 if (bx % 3 == 0) else 1
        draw.rectangle([(bx, int(h * 0.65)), (bx + bw, int(h * 0.72))], fill=(15, 23, 42))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue(), "forensics_case_dossier_microtext.png"


# ===========================================================================
# End-to-End API Integration Tests for Presets
# ===========================================================================

@pytest.mark.anyio
async def test_e2e_preset_benthanh_analyze_and_ela():
    """Verify Preset 1 (Ben Thanh) across /api/forensics/analyze and /api/forensics/ela."""
    img_bytes, filename = generate_preset_benthanh()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Test Analyze via multipart
        res_analyze_mp = await client.post(
            "/api/forensics/analyze",
            files={"file": (filename, img_bytes, "image/jpeg")},
        )
        assert res_analyze_mp.status_code == 200, res_analyze_mp.text
        data_mp = res_analyze_mp.json()
        assert data_mp["status"] == "success"
        assert data_mp["filename"] == filename
        assert data_mp["file_info"]["width"] == 800
        assert data_mp["file_info"]["height"] == 600
        assert data_mp["file_info"]["format"] == "JPEG"
        assert len(data_mp["file_info"]["md5"]) == 32
        assert len(data_mp["file_info"]["sha256"]) == 64

        # 2. Test Analyze via JSON base64
        res_analyze_json = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": b64_str, "filename": filename},
        )
        assert res_analyze_json.status_code == 200
        data_json = res_analyze_json.json()
        assert data_json["file_info"]["md5"] == data_mp["file_info"]["md5"]

        # 3. Test ELA via JSON base64
        res_ela = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "filename": filename, "quality": 90, "scale": 15.0, "colormap": "jet"},
        )
        assert res_ela.status_code == 200, res_ela.text
        ela_data = res_ela.json()
        assert ela_data["status"] == "success"
        assert ela_data["ela_image_base64"].startswith("data:image/png;base64,")
        assert ela_data["heatmap_base64"].startswith("data:image/png;base64,")
        assert "mean_difference" in ela_data["statistics"]
        assert "max_difference" in ela_data["statistics"]


@pytest.mark.anyio
async def test_e2e_preset_ela_anomaly_detection():
    """Verify Preset 2 (Tampered Plate) triggers valid ELA metrics and response schema."""
    img_bytes, filename = generate_preset_ela_anomaly()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "filename": filename, "quality": 90, "scale": 20.0, "colormap": "jet"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "success"
        assert data["quality"] == 90
        assert data["scale"] == 20.0
        assert data["statistics"]["max_difference"] > 0
        assert data["statistics"]["mean_difference"] > 0
        assert data["statistics"]["manipulation_risk"] in ("low", "medium", "high")


@pytest.mark.anyio
async def test_e2e_preset_solar_shadow_and_suncalc_hanoi():
    """Verify Preset 3 (Flagpole Shadow 205 deg Hanoi) interacts with /api/forensics/suncalc."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "latitude": 21.0313,
            "longitude": 105.8402,
            "date": "2024-05-15",
            "shadow_azimuth": 205.0,
            "timezone_offset": 7.0,
        }
        res = await client.post("/api/forensics/suncalc", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "success"
        # Antipodal check: shadow pointing 205° (SSW) means sun is at 25° (NNE)
        assert abs(data["sun_azimuth_deg"] - 25.0) < 0.1
        assert data["estimated_time_local"] == "05:23"
        assert "Sáng sớm" in data["time_of_day_category"] or "Early Morning" in data["time_of_day_category"]
        assert len(data["solar_path_24h"]) == 48


@pytest.mark.anyio
async def test_e2e_preset_solar_shadow_and_suncalc_hcmc():
    """Verify Preset 1 / HCMC Solar parameters (10.7769 N, 106.7009 E) yield midday 11:37 Solar Noon."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "latitude": 10.7769,
            "longitude": 106.7009,
            "date": "2024-05-15",
            "shadow_azimuth": 200.0,
            "timezone_offset": 7.0,
        }
        res = await client.post("/api/forensics/suncalc", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "success"
        assert abs(data["sun_azimuth_deg"] - 20.0) < 0.1
        assert data["estimated_time_local"] == "11:37"
        assert "Trưa" in data["time_of_day_category"] or "Solar Noon" in data["time_of_day_category"]
        assert data["solar_altitude_deg"] > 80.0
        assert len(data["solar_path_24h"]) == 48


@pytest.mark.anyio
async def test_e2e_preset_fb_fingerprint_extraction():
    """Verify Preset 4 (Facebook CDN Hash) filename digital fingerprint decoding via backend."""
    img_bytes, filename = generate_preset_fb_fingerprint()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": b64_str, "filename": filename},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        fp = data["fingerprint"]
        assert fp["matched"] is True
        assert fp["platform"].lower() == "facebook"
        assert fp["user_id"] == "1021482910398402"
        assert fp["photo_id"] == "2049182049182049"
        assert fp["unix_timestamp"] == 1715783400
        assert len(fp["osint_links"]) >= 2
        assert any("2049182049182049" in link for link in fp["osint_links"])


@pytest.mark.anyio
async def test_e2e_preset_micro_text_png_analyze_and_ela():
    """Verify Preset 5 (Micro-text PNG) handles lossless image ELA and analysis without errors."""
    img_bytes, filename = generate_preset_micro_text()
    b64_str = "data:image/png;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Analyze
        res_analyze = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": b64_str, "filename": filename},
        )
        assert res_analyze.status_code == 200, res_analyze.text
        data_a = res_analyze.json()
        assert data_a["file_info"]["format"] == "PNG"

        # 2. ELA on lossless PNG
        res_ela = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "filename": filename, "quality": 95, "scale": 15.0},
        )
        assert res_ela.status_code == 200, res_ela.text
        data_ela = res_ela.json()
        assert data_ela["status"] == "success"
        assert data_ela["is_lossless_source"] is True
