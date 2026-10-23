"""Empirical Challenger Verification Harness for Milestone 1 (Backend Forensics).

Adversarial test suite authored by Challenger 2 to empirically verify:
1. Synthetic spliced image ELA error disparity (Q=70 background vs uncompressed stamp).
2. NOAA solar celestial algorithm precision across global benchmarks (< 1.0 degree tolerance).
3. Reverse chronolocation time & azimuth estimation (shadow azimuth 200 deg -> sun azimuth 20 deg).
4. Boundary stress testing (polar day/night, out-of-range parameters, dual-ingestion equivalence).
"""

import base64
import io
import math
from datetime import datetime, timezone, date
from typing import Tuple

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image, ImageDraw

from app.main import app
from app.services.forensics_service import (
    calculate_solar_position,
    compute_error_level_analysis,
    estimate_chronolocation,
    get_suncalc_data,
)


def _noaa_reference_standard(lat: float, lon: float, dt_utc: datetime) -> Tuple[float, float, float, float]:
    """Independent reference implementation of the official NOAA ESRL Solar Position algorithm.
    
    Returns:
        (altitude_deg, azimuth_deg, declination_deg, equation_of_time_minutes)
    """
    y, m, d = dt_utc.year, dt_utc.month, dt_utc.day
    h, mi, s = dt_utc.hour, dt_utc.minute, dt_utc.second

    if m <= 2:
        y -= 1
        m += 12
    a = math.floor(y / 100)
    b = 2 - a + math.floor(a / 4)
    day_fraction = (h + mi / 60.0 + s / 3600.0) / 24.0
    jd = math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5 + day_fraction
    t = (jd - 2451545.0) / 36525.0

    l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360.0
    m_deg = 357.52911 + t * (35999.05029 - 0.0001537 * t)
    m_rad = math.radians(m_deg)
    e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
    c = (
        math.sin(m_rad) * (1.914602 - t * (0.004817 + 0.000014 * t))
        + math.sin(2 * m_rad) * (0.019993 - 0.000101 * t)
        + math.sin(3 * m_rad) * 0.000289
    )
    sun_true_long = l0 + c
    sun_app_long = sun_true_long - 0.00569 - 0.00478 * math.sin(math.radians(125.04 - 1934.136 * t))

    eps0 = 23.0 + (26.0 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60.0) / 60.0
    eps = eps0 + 0.00256 * math.cos(math.radians(125.04 - 1934.136 * t))

    sin_delta = math.sin(math.radians(eps)) * math.sin(math.radians(sun_app_long))
    delta = math.degrees(math.asin(sin_delta))

    y_tan = math.tan(math.radians(eps) / 2.0) ** 2
    eq_time_rad = (
        y_tan * math.sin(2 * math.radians(l0))
        - 2 * e * math.sin(m_rad)
        + 4 * e * y_tan * math.sin(m_rad) * math.cos(2 * math.radians(l0))
        - 0.5 * (y_tan**2) * math.sin(4 * math.radians(l0))
        - 1.25 * (e**2) * math.sin(2 * m_rad)
    )
    eq_time_min = 4.0 * math.degrees(eq_time_rad)

    time_offset = eq_time_min + 4.0 * lon
    true_solar_time = (h * 60.0 + mi + s / 60.0 + time_offset) % 1440.0

    ha = true_solar_time / 4.0 - 180.0 if true_solar_time / 4.0 >= 0 else true_solar_time / 4.0 + 180.0
    if ha < -180.0:
        ha += 360.0
    if ha > 180.0:
        ha -= 360.0

    phi = math.radians(lat)
    delta_rad = math.radians(delta)
    ha_rad = math.radians(ha)

    cos_zenith = math.sin(phi) * math.sin(delta_rad) + math.cos(phi) * math.cos(delta_rad) * math.cos(ha_rad)
    cos_zenith = max(-1.0, min(1.0, cos_zenith))
    zenith = math.degrees(math.acos(cos_zenith))
    altitude = 90.0 - zenith

    sin_zenith = math.sin(math.radians(zenith))
    if sin_zenith > 0.0001:
        cos_az = (math.sin(phi) * math.cos(math.radians(zenith)) - math.sin(delta_rad)) / (math.cos(phi) * sin_zenith)
        cos_az = max(-1.0, min(1.0, cos_az))
        az_deg = math.degrees(math.acos(cos_az))
        if ha > 0:
            azimuth = (az_deg + 180.0) % 360.0
        else:
            azimuth = (540.0 - az_deg) % 360.0
    else:
        azimuth = 180.0 if lat > 0 else 0.0

    return altitude, azimuth, delta, eq_time_min


def _create_synthetic_spliced_test_image() -> Tuple[bytes, Tuple[int, int, int, int]]:
    """Create a synthetic spliced test image:
    - Background: 320x320 smooth gradient pre-compressed at JPEG Q=70
    - Stamp: 80x80 uncompressed high-frequency multi-scale pattern pasted at (120, 120, 200, 200)
    - Re-saved at Q=85 to simulate saved forged artifact
    Returns (image_bytes, bbox=(x0, y0, x1, y1))
    """
    w, h = 320, 320
    bg = Image.new("RGB", (w, h), color=(100, 120, 140))
    draw = ImageDraw.Draw(bg)
    for y in range(h):
        for x in range(w):
            r = int((x / w) * 150 + 50)
            g = int((y / h) * 130 + 60)
            b = int(((x + y) / (w + h)) * 180 + 40)
            draw.point((x, y), fill=(r, g, b))

    # Compress background at Q=70
    buf_bg = io.BytesIO()
    bg.save(buf_bg, format="JPEG", quality=70)
    bg_loaded = Image.open(io.BytesIO(buf_bg.getvalue()))

    # Create uncompressed high-frequency stamp
    stamp_size = 80
    stamp = Image.new("RGB", (stamp_size, stamp_size))
    for y in range(stamp_size):
        for x in range(stamp_size):
            val = 255 if (x % 8 < 4) ^ (y % 8 < 4) else 0
            stamp.putpixel((x, y), (val, val, 255 - val))

    x0, y0 = 120, 120
    x1, y1 = x0 + stamp_size, y0 + stamp_size
    spliced = bg_loaded.copy()
    spliced.paste(stamp, (x0, y0))

    buf_final = io.BytesIO()
    spliced.save(buf_final, format="JPEG", quality=85)
    return buf_final.getvalue(), (x0, y0, x1, y1)


# ===========================================================================
# 1. EMPIRICAL TEST: Synthetic Spliced Image ELA Verification
# ===========================================================================

def test_empirical_synthetic_spliced_ela():
    """Verify that in a synthetic spliced image (Q=70 bg + uncompressed stamp),
    the spliced region exhibits measurably higher error than the background region.
    """
    img_bytes, (x0, y0, x1, y1) = _create_synthetic_spliced_test_image()

    # 1. Run ELA service directly
    ela_res = compute_error_level_analysis(img_bytes, quality=90, scale=15.0)
    assert ela_res.status == "success"
    assert ela_res.statistics.tampering_detected is True
    assert ela_res.statistics.manipulation_risk in ("medium", "high")
    assert ela_res.statistics.max_difference > 30.0

    # 2. Decode returned ELA difference image and verify pixel-by-pixel regional disparity
    b64_str = ela_res.ela_image_base64.split(",", 1)[1]
    ela_img = Image.open(io.BytesIO(base64.b64decode(b64_str)))
    ela_arr = np.asarray(ela_img, dtype=np.float32)

    patch_ela = ela_arr[y0:y1, x0:x1]
    patch_mean = float(np.mean(patch_ela))

    h, w = ela_arr.shape[:2]
    mask = np.ones((h, w), dtype=bool)
    mask[y0:y1, x0:x1] = False
    bg_ela = ela_arr[mask]
    bg_mean = float(np.mean(bg_ela))

    # The spliced region must exhibit vastly higher error (> 20x higher)
    ratio = patch_mean / max(bg_mean, 1e-6)
    assert ratio > 20.0, f"Expected patch error to be > 20x background, got {ratio:.2f}x"
    assert patch_mean > 50.0, f"Expected visible error in patch (>50/255), got {patch_mean:.2f}"
    assert bg_mean < 5.0, f"Expected background error to be near zero (<5/255), got {bg_mean:.2f}"


@pytest.mark.anyio
async def test_empirical_spliced_ela_endpoint_http():
    """Verify the /api/forensics/ela endpoint returns higher error and flags tampering via HTTP."""
    img_bytes, (x0, y0, x1, y1) = _create_synthetic_spliced_test_image()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("synthetic_spliced_q70.jpg", img_bytes, "image/jpeg")}
        data = {"quality": "90", "scale": "15.0"}
        res = await client.post("/api/forensics/ela", files=files, data=data)

        assert res.status_code == 200, res.text
        body = res.json()
        stats = body["statistics"]
        assert stats["tampering_detected"] is True
        assert stats["manipulation_risk"] in ("medium", "high")
        assert stats["max_difference"] > 30.0
        assert body["metrics"]["hotspot_blocks"] >= 1.0


# ===========================================================================
# 2. EMPIRICAL TEST: NOAA Solar Position Benchmarks (< 1.0 deg tolerance)
# ===========================================================================

@pytest.mark.parametrize(
    "name, lat, lon, dt_utc",
    [
        (
            "Ho Chi Minh City (2024-05-15 12:00 Local = 05:00 UTC)",
            10.7769,
            106.7009,
            datetime(2024, 5, 15, 5, 0, 0, tzinfo=timezone.utc),
        ),
        (
            "Greenwich Royal Observatory (2024-06-21 12:00 UTC Solstice)",
            51.4769,
            0.0005,
            datetime(2024, 6, 21, 12, 0, 0, tzinfo=timezone.utc),
        ),
        (
            "Equator Prime Meridian (2024-03-20 12:00 UTC Equinox)",
            0.0,
            0.0,
            datetime(2024, 3, 20, 12, 0, 0, tzinfo=timezone.utc),
        ),
        (
            "Sydney Australia (2024-12-21 12:00 Local = 01:00 UTC Solstice)",
            -33.8688,
            151.2093,
            datetime(2024, 12, 21, 1, 0, 0, tzinfo=timezone.utc),
        ),
        (
            "Tokyo Japan (2024-09-22 12:00 Local = 03:00 UTC Equinox)",
            35.6762,
            139.6503,
            datetime(2024, 9, 22, 3, 0, 0, tzinfo=timezone.utc),
        ),
    ],
)
def test_empirical_solar_position_noaa_benchmarks(name, lat, lon, dt_utc):
    """Verify calculated solar altitude, azimuth, and declination match NOAA standard within 1.0 deg."""
    ref_alt, ref_az, ref_dec, ref_eq = _noaa_reference_standard(lat, lon, dt_utc)
    service_pos = calculate_solar_position(lat, lon, dt_utc)

    diff_alt = abs(ref_alt - service_pos.altitude)
    diff_dec = abs(ref_dec - service_pos.declination)

    # 1. Altitude tolerance < 1.0 deg
    assert diff_alt < 1.0, f"[{name}] Altitude diff {diff_alt:.4f} deg exceeds 1.0 deg (ref={ref_alt}, svc={service_pos.altitude})"
    
    # Azimuth angular circular difference
    diff_az = abs(ref_az - service_pos.azimuth)
    diff_az = min(diff_az, 360.0 - diff_az)

    # 2. Celestial sphere great-circle angular separation < 1.0 deg
    rad = math.radians
    cos_sep = (
        math.sin(rad(ref_alt)) * math.sin(rad(service_pos.altitude))
        + math.cos(rad(ref_alt)) * math.cos(rad(service_pos.altitude)) * math.cos(rad(diff_az))
    )
    sep_deg = math.degrees(math.acos(min(1.0, max(-1.0, cos_sep))))
    assert sep_deg < 1.0, f"[{name}] True celestial angular separation {sep_deg:.4f} deg exceeds 1.0 deg"

    # 3. Azimuth tolerance < 1.0 deg for all non-zenith angles (altitude <= 85 deg)
    if ref_alt <= 85.0:
        assert diff_az < 1.0, f"[{name}] Azimuth diff {diff_az:.4f} deg exceeds 1.0 deg (ref={ref_az}, svc={service_pos.azimuth})"
    assert diff_dec < 1.0, f"[{name}] Declination diff {diff_dec:.4f} deg exceeds 1.0 deg (ref={ref_dec}, svc={service_pos.declination})"


# ===========================================================================
# 3. EMPIRICAL TEST: Reverse Chronolocation Time & Sun Azimuth Estimation
# ===========================================================================

def test_empirical_reverse_chronolocation_hcmc():
    """Verify reverse chronolocation: given shadow pointing SSW (azimuth 200 deg),
    estimated sun position is NNE (azimuth 20 deg) and estimated time matches expected daylight hour.
    """
    target_shadow_az = 200.0
    expected_sun_az = (target_shadow_az + 180.0) % 360.0  # 20.0 deg

    res = estimate_chronolocation(
        latitude=10.7769,
        longitude=106.7009,
        target_date=date(2024, 5, 15),
        shadow_azimuth=target_shadow_az,
        timezone_offset=7.0,
    )

    # 1. Verify antipodal relationship
    assert res.target_shadow_azimuth == 200.0
    assert res.target_sun_azimuth == 20.0
    assert abs(res.target_sun_azimuth - expected_sun_az) < 1e-4

    # 2. Verify estimated capture time falls in expected daylight hours (midday)
    local_time = res.estimated_local_time
    h, m = map(int, local_time.split(":"))
    assert 11 <= h <= 12, f"Expected local midday hour (11:00-12:59), got {local_time}"
    assert res.estimated_local_time == "11:37"
    assert res.estimated_utc_time == "04:37"

    # 3. Verify daylight solar position
    assert res.solar_altitude_deg > 80.0, f"Expected high solar altitude at midday, got {res.solar_altitude_deg}"
    assert res.angular_error_degrees < 1.0, f"Expected minimal angular residual, got {res.angular_error_degrees}"
    assert res.confidence == "high"


@pytest.mark.anyio
async def test_empirical_reverse_chronolocation_api_endpoint():
    """Verify /api/forensics/suncalc endpoint computes correct chronolocation via HTTP."""
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

        assert data["sun_azimuth_deg"] == 20.0
        assert data["estimated_time_local"] == "11:37"
        assert data["estimated_time_utc"] == "04:37"
        assert data["solar_altitude_deg"] > 80.0
        assert "Solar Noon" in data["time_of_day_category"]

        chrono = data["chronolocation"]
        assert chrono["target_shadow_azimuth"] == 200.0
        assert chrono["target_sun_azimuth"] == 20.0
        assert chrono["confidence"] == "high"
        assert chrono["angular_error_degrees"] < 1.0


# ===========================================================================
# 4. EMPIRICAL TEST: Adversarial Stress & Boundary Conditions
# ===========================================================================

@pytest.mark.anyio
async def test_empirical_polar_extremes():
    """Stress test solar calculations at polar latitudes (midnight sun and polar night)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Midnight sun at 80 deg North on Summer Solstice
        res_mid_sun = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 80.0, "longitude": 15.0, "date": "2024-06-21", "time": "12:00:00"},
        )
        assert res_mid_sun.status_code == 200
        events_sun = res_mid_sun.json()["solar_events"]
        assert "Midnight Sun" in events_sun["sunrise"]
        assert events_sun["daylight_duration_hours"] == 24.0

        # Polar night at 80 deg North on Winter Solstice
        res_pol_night = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 80.0, "longitude": 15.0, "date": "2024-12-21", "time": "12:00:00"},
        )
        assert res_pol_night.status_code == 200
        events_night = res_pol_night.json()["solar_events"]
        assert "Polar Night" in events_night["sunrise"]
        assert events_night["daylight_duration_hours"] == 0.0


@pytest.mark.anyio
async def test_empirical_ela_parameter_clamping_and_formats():
    """Stress test ELA parameter clamping (out-of-bounds quality & scale) and transparent PNGs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Transparent RGBA PNG
        png_img = Image.new("RGBA", (64, 64), (200, 100, 50, 128))
        buf = io.BytesIO()
        png_img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        # Pass extreme parameters: quality=999 (should clamp to 100), scale=-5.0 (should clamp to 1.0)
        res = await client.post(
            "/api/forensics/ela",
            files={"file": ("alpha.png", png_bytes, "image/png")},
            data={"quality": "999", "scale": "-5.0", "colormap": "inferno"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["quality"] == 100
        assert data["scale"] == 1.0
        assert data["colormap"] == "inferno"
        assert data["is_lossless_source"] is True


@pytest.mark.anyio
async def test_empirical_dual_ingestion_payload_identity():
    """Verify multipart file upload and base64 JSON ingestion produce identical cryptographic hashes."""
    img = Image.new("RGB", (100, 100), color=(60, 90, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    img_bytes = buf.getvalue()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Multipart
        res_mp = await client.post(
            "/api/forensics/analyze",
            files={"file": ("test_dual.jpg", img_bytes, "image/jpeg")},
        )
        assert res_mp.status_code == 200
        data_mp = res_mp.json()

        # Base64 JSON
        res_json = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": b64_str, "filename": "test_dual.jpg"},
        )
        assert res_json.status_code == 200
        data_json = res_json.json()

        # Cryptographic and structural identity
        assert data_mp["file_info"]["md5"] == data_json["file_info"]["md5"]
        assert data_mp["file_info"]["sha256"] == data_json["file_info"]["sha256"]
        assert data_mp["file_info"]["width"] == data_json["file_info"]["width"]
        assert data_mp["file_info"]["height"] == data_json["file_info"]["height"]
