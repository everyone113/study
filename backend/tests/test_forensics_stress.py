"""Adversarial & Empirical Stress Test Suite for Photo Forensics Studio (Milestone 1).

Written and executed by Challenger 1 to stress-test:
1. Extreme/fuzzed image inputs: empty bytes, pure random noise, truncated JPEG, oversized images, zero-length base64.
2. ELA with extreme quality values (Q=1, Q=10, Q=100) and scale values (scale=1, scale=50). Verifies unhandled exception behavior.
3. SunCalc with extreme latitudes (-90.0, 90.0, 89.999), extreme longitudes (-180, 180), dates at solstices/equinoxes.
"""

import base64
import io
import os
from datetime import date, datetime
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image, ExifTags
from PIL.TiffImagePlugin import IFDRational

from app.main import app
from app.services import forensics_service


# ---------------------------------------------------------------------------
# Helper Generators for Fuzzed & Extreme Test Inputs
# ---------------------------------------------------------------------------

def _make_valid_jpeg(size=(64, 64), color=(100, 150, 200)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def _make_oversized_jpeg(size=(3500, 3500)) -> bytes:
    """Generate large dimension image to test memory & resizing behavior."""
    img = Image.new("RGB", size, color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=50)
    return buf.getvalue()


def _make_extreme_aspect_ratio_jpeg(size=(1, 5000)) -> bytes:
    """Generate extreme aspect ratio image (e.g. 1x5000 or 5000x1)."""
    img = Image.new("RGB", size, color=(200, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=75)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# 1. Stress Testing /api/forensics/analyze with Extreme & Fuzzed Inputs
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_analyze_empty_bytes_multipart_and_json():
    """Verify empty bytes are rejected with HTTP 400 and clear error detail."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Empty multipart
        res_empty_file = await client.post(
            "/api/forensics/analyze",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
        )
        assert res_empty_file.status_code == 400
        assert "empty" in res_empty_file.json()["detail"].lower()

        # 2. Empty base64 string
        res_empty_b64 = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": "", "filename": "empty.jpg"},
        )
        assert res_empty_b64.status_code == 400

        # 3. Base64 prefix only (zero-length decoded data)
        res_prefix_only = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": "data:image/jpeg;base64,", "filename": "empty.jpg"},
        )
        assert res_prefix_only.status_code == 400

        # 4. Whitespace only base64
        res_whitespace = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": "   \n\t  ", "filename": "empty.jpg"},
        )
        assert res_whitespace.status_code == 400


@pytest.mark.anyio
async def test_analyze_pure_random_noise_fuzzing():
    """Verify pure random byte noise never crashes or returns 500; must return 400."""
    noise_samples = [
        os.urandom(16),
        os.urandom(256),
        os.urandom(1024),
        os.urandom(16384),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for idx, noise in enumerate(noise_samples):
            # Multipart
            res_noise_mp = await client.post(
                "/api/forensics/analyze",
                files={"file": (f"noise_{idx}.jpg", noise, "image/jpeg")},
            )
            assert res_noise_mp.status_code == 400, f"Expected 400 for noise sample {idx}, got {res_noise_mp.status_code}"

            # JSON Base64
            b64_noise = base64.b64encode(noise).decode("ascii")
            res_noise_json = await client.post(
                "/api/forensics/analyze",
                json={"image_base64": b64_noise, "filename": f"noise_{idx}.jpg"},
            )
            assert res_noise_json.status_code == 400, f"Expected 400 for JSON noise sample {idx}"


@pytest.mark.anyio
async def test_analyze_truncated_jpegs():
    """Verify truncated JPEGs at header cutoff thresholds return 400."""
    valid_jpeg = _make_valid_jpeg((128, 128))
    total_len = len(valid_jpeg)

    # Cutoffs that break the JPEG header: 2 bytes (SOI only), 10%, 25% of file size
    broken_header_cutoffs = [
        2,
        int(total_len * 0.1),
        int(total_len * 0.25),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for cutoff in broken_header_cutoffs:
            truncated = valid_jpeg[:cutoff]
            res = await client.post(
                "/api/forensics/analyze",
                files={"file": (f"trunc_{cutoff}.jpg", truncated, "image/jpeg")},
            )
            assert res.status_code == 400, f"Cutoff {cutoff} did not return 400 (got {res.status_code})"


@pytest.mark.anyio
async def test_analyze_oversized_and_extreme_aspect_ratio_images():
    """Verify oversized images (12+ megapixels) and extreme aspect ratios (1x5000) are processed reliably."""
    large_jpeg = _make_oversized_jpeg((3500, 3500))  # 12.25 MP
    thin_tall_jpeg = _make_extreme_aspect_ratio_jpeg((1, 4000))
    wide_flat_jpeg = _make_extreme_aspect_ratio_jpeg((4000, 1))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Large image
        res_large = await client.post(
            "/api/forensics/analyze",
            files={"file": ("large_image.jpg", large_jpeg, "image/jpeg")},
        )
        assert res_large.status_code == 200, res_large.text
        data_large = res_large.json()
        assert data_large["file_info"]["width"] == 3500
        assert data_large["file_info"]["height"] == 3500

        # Extreme tall image (1x4000)
        res_tall = await client.post(
            "/api/forensics/analyze",
            files={"file": ("tall_image.jpg", thin_tall_jpeg, "image/jpeg")},
        )
        assert res_tall.status_code == 200, res_tall.text
        assert res_tall.json()["file_info"]["width"] == 1
        assert res_tall.json()["file_info"]["height"] == 4000

        # Extreme wide image (4000x1)
        res_wide = await client.post(
            "/api/forensics/analyze",
            files={"file": ("wide_image.jpg", wide_flat_jpeg, "image/jpeg")},
        )
        assert res_wide.status_code == 200, res_wide.text
        assert res_wide.json()["file_info"]["width"] == 4000
        assert res_wide.json()["file_info"]["height"] == 1


@pytest.mark.anyio
async def test_analyze_minimal_1x1_image_and_monochrome():
    """Verify 1x1 pixel image and 1-bit monochrome formats process gracefully."""
    # 1x1 image
    one_pixel = _make_valid_jpeg((1, 1))

    # 1-bit monochrome
    mono_img = Image.new("1", (50, 50), 1)
    buf_mono = io.BytesIO()
    mono_img.save(buf_mono, format="PNG")
    mono_bytes = buf_mono.getvalue()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_1x1 = await client.post(
            "/api/forensics/analyze",
            files={"file": ("tiny.jpg", one_pixel, "image/jpeg")},
        )
        assert res_1x1.status_code == 200
        assert res_1x1.json()["file_info"]["width"] == 1
        assert res_1x1.json()["file_info"]["height"] == 1

        res_mono = await client.post(
            "/api/forensics/analyze",
            files={"file": ("mono.png", mono_bytes, "image/png")},
        )
        assert res_mono.status_code == 200
        assert res_mono.json()["file_info"]["mode"] == "1"


@pytest.mark.anyio
async def test_analyze_corrupt_exif_gps_tags():
    """Verify corrupted EXIF GPS values (zero division, invalid tuples) do not crash metadata extraction."""
    img = Image.new("RGB", (80, 80), color=(150, 150, 150))
    exif = img.getexif()

    # Corrupted GPS IFD with zero division rational or negative denominator
    gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps_ifd[ExifTags.GPS.GPSLatitude] = (IFDRational(10, 0), IFDRational(20, 0), IFDRational(30, 0))
    gps_ifd[ExifTags.GPS.GPSLatitudeRef] = "N"
    gps_ifd[ExifTags.GPS.GPSAltitude] = IFDRational(100, 0)
    gps_ifd[ExifTags.GPS.GPSAltitudeRef] = 0

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    corrupted_exif_bytes = buf.getvalue()

    resp = forensics_service.extract_metadata(corrupted_exif_bytes, "corrupted_exif.jpg")
    assert resp.status == "success"
    assert resp.gps.latitude is None or resp.gps.has_gps is False


@pytest.mark.anyio
async def test_analyze_filename_injection_and_path_traversal():
    """Stress test filename parsing with path traversal, unicode, null characters, and long strings."""
    valid_jpeg = _make_valid_jpeg()

    adversarial_filenames = [
        "../../../../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\cmd.exe",
        "A" * 2000 + ".jpg",
        "ảnh_chụp_ngày_mưa_☔_với_kính_lúp_🔍.jpeg",
        "FB_IMG_99999999999999999999.jpg",
        "zalo_0000000000.jpg",
        "received_-1.jpeg",
        "nul.jpg",
        "con.jpg",
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for fname in adversarial_filenames:
            res = await client.post(
                "/api/forensics/analyze",
                files={"file": (fname, valid_jpeg, "image/jpeg")},
            )
            assert res.status_code == 200, f"Failed on filename: {fname!r}"
            assert res.json()["status"] == "success"

        # Empty filename in multipart is rejected as invalid upload
        res_empty_fname = await client.post(
            "/api/forensics/analyze",
            files={"file": ("", valid_jpeg, "image/jpeg")},
        )
        assert res_empty_fname.status_code == 400


# ---------------------------------------------------------------------------
# 2. Stress Testing ELA with Extreme Quality, Scale & Truncated Scan Data
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_ela_extreme_quality_values_service_direct():
    """Directly test compute_error_level_analysis with extreme quality values (Q=1, Q=10, Q=100, Q=0, Q=150).

    Verifies that the service function clamps quality into [10, 100] and never raises an unhandled exception.
    """
    valid_jpeg = _make_valid_jpeg((100, 100))

    extreme_qualities = [0, 1, 5, 10, 50, 90, 100, 101, 200]

    for q in extreme_qualities:
        res = forensics_service.compute_error_level_analysis(
            image_bytes=valid_jpeg,
            filename=f"ela_q{q}.jpg",
            quality=q,
            scale=15.0,
        )
        assert res.status == "success"
        expected_q = max(10, min(100, q))
        assert res.quality == expected_q
        assert res.quality_used == expected_q
        assert res.ela_image_base64.startswith("data:image/png;base64,")
        assert res.heatmap_base64.startswith("data:image/png;base64,")
        assert res.statistics.max_difference >= 0.0
        assert res.statistics.manipulation_risk in ("low", "medium", "high")


@pytest.mark.anyio
async def test_ela_extreme_scale_values_service_direct():
    """Directly test compute_error_level_analysis with extreme scale values (scale=0.1, 1.0, 50.0, 999.0).

    Verifies that scale is clamped into [1.0, 50.0] and pixel values are clipped to [0, 255] without overflow.
    """
    valid_jpeg = _make_valid_jpeg((100, 100))

    extreme_scales = [-10.0, 0.0, 0.5, 1.0, 25.0, 50.0, 50.1, 1000.0]

    for s in extreme_scales:
        res = forensics_service.compute_error_level_analysis(
            image_bytes=valid_jpeg,
            filename=f"ela_s{s}.jpg",
            quality=90,
            scale=s,
        )
        assert res.status == "success"
        expected_s = max(1.0, min(50.0, float(s)))
        assert res.scale == expected_s
        assert res.scale_used == expected_s
        assert res.statistics.mean_difference >= 0.0


@pytest.mark.anyio
async def test_ela_api_multipart_extreme_parameters():
    """Test /api/forensics/ela via multipart with extreme quality (1, 10, 100) and scale (1, 50)."""
    valid_jpeg = _make_valid_jpeg((80, 80))

    test_combinations = [
        ("1", "1"),      # Clamped to Q=10, scale=1.0
        ("10", "1.0"),   # Lower bound
        ("50", "25.0"),  # Mid point
        ("100", "50.0"), # Upper bound
        ("100", "1.0"),  # High Q, min scale
        ("10", "50.0"),  # Low Q, max scale
        ("999", "999"),  # Over upper bounds, clamped to Q=100, scale=50.0
        ("invalid", "invalid"), # Fallback to defaults (Q=90, scale=15.0)
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for q_str, s_str in test_combinations:
            res = await client.post(
                "/api/forensics/ela",
                files={"file": ("ela_test.jpg", valid_jpeg, "image/jpeg")},
                data={"quality": q_str, "scale": s_str},
            )
            assert res.status_code == 200, f"Failed on Q={q_str}, scale={s_str}: {res.text}"
            data = res.json()
            assert data["status"] == "success"
            assert 10 <= data["quality"] <= 100
            assert 1.0 <= data["scale"] <= 50.0
            assert "statistics" in data
            assert data["statistics"]["max_difference"] >= 0.0


@pytest.mark.anyio
async def test_ela_api_json_validation_bounds():
    """Test /api/forensics/ela JSON endpoint rejects out-of-bounds Q/scale with client error (400 or 422)."""
    valid_jpeg = _make_valid_jpeg((64, 64))
    b64_str = "data:image/jpeg;base64," + base64.b64encode(valid_jpeg).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # JSON Q=9 (below ge=10) should be rejected as 400 or 422
        res_q_low = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "quality": 9},
        )
        assert res_q_low.status_code in (400, 422)

        # JSON Q=101 (above le=100) should be rejected
        res_q_high = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "quality": 101},
        )
        assert res_q_high.status_code in (400, 422)

        # JSON scale=0.5 (below ge=1.0) should be rejected
        res_s_low = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "scale": 0.5},
        )
        assert res_s_low.status_code in (400, 422)

        # JSON scale=55.0 (above le=50.0) should be rejected
        res_s_high = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "scale": 55.0},
        )
        assert res_s_high.status_code in (400, 422)

        # JSON valid extremes: Q=10, scale=1.0 and Q=100, scale=50.0
        res_valid_min = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "quality": 10, "scale": 1.0},
        )
        assert res_valid_min.status_code == 200

        res_valid_max = await client.post(
            "/api/forensics/ela",
            json={"image_base64": b64_str, "quality": 100, "scale": 50.0},
        )
        assert res_valid_max.status_code == 200


@pytest.mark.anyio
async def test_ela_tiny_and_oversized_images():
    """Verify ELA handles 1x1 image without hotspot division crash, and handles large images."""
    one_pixel = _make_valid_jpeg((1, 1))
    large_img = _make_oversized_jpeg((2000, 2000))

    res_1x1 = forensics_service.compute_error_level_analysis(one_pixel, "1x1.jpg", 90, 15.0)
    assert res_1x1.status == "success"
    assert res_1x1.statistics.mean_difference >= 0.0

    res_large = forensics_service.compute_error_level_analysis(large_img, "2000x2000.jpg", 90, 15.0)
    assert res_large.status == "success"
    assert res_large.statistics.mean_difference >= 0.0


# ---------------------------------------------------------------------------
# 3. Stress Testing SunCalc with Extreme Coordinates, Dates & Solstices
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_suncalc_extreme_latitudes():
    """Stress test SunCalc with exact boundary latitudes: -90.0, 90.0, 89.999, -89.999, 0.0."""
    extreme_coords = [
        (90.0, 0.0, "North Pole exact"),
        (-90.0, 0.0, "South Pole exact"),
        (89.999, 105.0, "Near North Pole"),
        (-89.999, -45.0, "Near South Pole"),
        (0.0, 0.0, "Null Island / Equator"),
        (0.0, 180.0, "Equator at Date Line"),
        (0.0, -180.0, "Equator at West Date Line"),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for lat, lon, desc in extreme_coords:
            payload = {
                "latitude": lat,
                "longitude": lon,
                "date": "2024-06-21",
                "time": "12:00:00",
            }
            res = await client.post("/api/forensics/suncalc", json=payload)
            assert res.status_code == 200, f"Failed on {desc} (lat={lat}, lon={lon}): {res.text}"
            data = res.json()
            assert data["status"] == "success"
            assert -90.0 <= data["solar_altitude_deg"] <= 90.0
            assert 0.0 <= data["sun_azimuth_deg"] <= 360.0
            assert len(data["solar_path_24h"]) == 48
            assert data["solar_events"] is not None


@pytest.mark.anyio
async def test_suncalc_solstices_and_equinoxes():
    """Verify SunCalc calculations at astronomical milestone dates across all seasons and leap years."""
    milestones = [
        ("2024-06-20", 21.0285, 105.8542, "Hanoi Summer Solstice 2024"),
        ("2024-12-21", 21.0285, 105.8542, "Hanoi Winter Solstice 2024"),
        ("2024-03-20", 0.0, 0.0, "Equator Vernal Equinox 2024"),
        ("2024-09-22", 0.0, 0.0, "Equator Autumnal Equinox 2024"),
        ("2024-02-29", 48.8566, 2.3522, "Paris Leap Day 2024"),
        ("2000-01-01", 35.6762, 139.6503, "Tokyo Millennium Epoch"),
        ("2038-01-19", 40.7128, -74.0060, "New York Y2038 Boundary"),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for date_str, lat, lon, label in milestones:
            payload = {
                "latitude": lat,
                "longitude": lon,
                "date": date_str,
                "time": "12:00:00",
            }
            res = await client.post("/api/forensics/suncalc", json=payload)
            assert res.status_code == 200, f"Failed on milestone {label}: {res.text}"
            data = res.json()
            assert data["status"] == "success"
            assert data["date"] == date_str


@pytest.mark.anyio
async def test_suncalc_polar_night_and_midnight_sun():
    """Verify polar regions gracefully handle 24h daylight (Midnight Sun) and 24h darkness (Polar Night)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Midnight Sun: Svalbard (lat=78.22) in June
        res_midnight = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 78.22, "longitude": 15.65, "date": "2024-06-21"},
        )
        assert res_midnight.status_code == 200
        events_midnight = res_midnight.json()["solar_events"]
        assert "Midnight Sun" in events_midnight["sunrise"]
        assert events_midnight["daylight_duration_hours"] == 24.0

        # 2. Polar Night: Svalbard (lat=78.22) in December
        res_polar_night = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 78.22, "longitude": 15.65, "date": "2024-12-21"},
        )
        assert res_polar_night.status_code == 200
        events_polar_night = res_polar_night.json()["solar_events"]
        assert "Polar Night" in events_polar_night["sunrise"]
        assert events_polar_night["daylight_duration_hours"] == 0.0


@pytest.mark.anyio
async def test_suncalc_reverse_chronolocation_extreme_angles():
    """Stress test reverse chronolocation solver with extreme shadow azimuths and ratios."""
    test_cases = [
        {"shadow_azimuth": 0.0, "shadow_length_ratio": 0.01},    # Shadow due North, sun due South near zenith
        {"shadow_azimuth": 360.0, "shadow_length_ratio": 1.0},   # 360 degrees boundary
        {"shadow_azimuth": 180.0, "shadow_length_ratio": 10.0},  # Shadow due South, low sun
        {"shadow_azimuth": 90.0, "shadow_length_ratio": 0.5},    # Shadow due East, afternoon sun
        {"shadow_azimuth": 270.0, "shadow_length_ratio": 0.5},   # Shadow due West, morning sun
        {"shadow_azimuth": 0.001, "shadow_length_ratio": 99.0},  # Near zero epsilon
        {"shadow_azimuth": 359.999, "shadow_length_ratio": 0.0001}, # Near 360 epsilon
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for params in test_cases:
            payload = {
                "latitude": 10.7769,
                "longitude": 106.7009,
                "date": "2024-05-15",
                **params,
            }
            res = await client.post("/api/forensics/suncalc", json=payload)
            assert res.status_code == 200, f"Failed for params {params}: {res.text}"
            data = res.json()
            assert data["status"] == "success"
            chrono = data["chronolocation"]
            assert chrono is not None
            assert 0.0 <= chrono["target_shadow_azimuth"] <= 360.0
            assert 0.0 <= chrono["target_sun_azimuth"] <= 360.0
            assert ":" in chrono["estimated_local_time"]
            assert chrono["confidence"] in ("high", "medium", "low")


@pytest.mark.anyio
async def test_suncalc_boundary_coordinates_validation_errors():
    """Verify that coordinates outside [-90, 90] and [-180, 180] are strictly rejected with 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        bad_lat_cases = [90.001, -90.001, 100.0, -120.0]
        for b_lat in bad_lat_cases:
            res = await client.post(
                "/api/forensics/suncalc",
                json={"latitude": b_lat, "longitude": 0.0, "date": "2024-05-15"},
            )
            assert res.status_code == 422, f"Latitude {b_lat} should have been rejected with 422"

        bad_lon_cases = [180.001, -180.001, 200.0, -360.0]
        for b_lon in bad_lon_cases:
            res = await client.post(
                "/api/forensics/suncalc",
                json={"latitude": 0.0, "longitude": b_lon, "date": "2024-05-15"},
            )
            assert res.status_code == 422, f"Longitude {b_lon} should have been rejected with 422"

        # Shadow azimuth out of range [0, 360]
        bad_azimuth_cases = [-1.0, 360.1, 500.0]
        for b_az in bad_azimuth_cases:
            res = await client.post(
                "/api/forensics/suncalc",
                json={"latitude": 10.0, "longitude": 100.0, "shadow_azimuth": b_az},
            )
            assert res.status_code == 422, f"Shadow azimuth {b_az} should have been rejected with 422"


# ---------------------------------------------------------------------------
# 4. Empirical Vulnerability Demonstrations (Challenger Findings)
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_ela_truncated_jpeg_unhandled_500_vulnerability():
    """Verify that truncated JPEGs uploaded to /api/forensics/ela are cleanly rejected
    with HTTP 400 Bad Request, never triggering unhandled HTTP 500 Internal Server Error.
    Verifies both multipart/form-data and application/json base64 payloads across multiple cutoff lengths.
    """
    valid_jpeg = _make_valid_jpeg((128, 128))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for cut in [10, 50, 200]:
            truncated = valid_jpeg[:-cut]
            # 1. Multipart file upload channel
            res_mp = await client.post("/api/forensics/ela", files={"file": (f"trunc_{cut}.jpg", truncated, "image/jpeg")})
            assert res_mp.status_code == 400, (
                f"Expected HTTP 400 for truncated JPEG ({cut} bytes missing), "
                f"got {res_mp.status_code}. Response: {res_mp.text}"
            )
            detail_mp = res_mp.json().get("detail", "").lower()
            assert any(word in detail_mp for word in ["truncated", "corrupt", "invalid", "failed"]), (
                f"Expected informative error detail, got: {res_mp.json()}"
            )

            # 2. JSON Base64 payload channel
            b64_trunc = "data:image/jpeg;base64," + base64.b64encode(truncated).decode("ascii")
            res_json = await client.post(
                "/api/forensics/ela",
                json={"image_base64": b64_trunc, "filename": f"trunc_{cut}.jpg"},
            )
            assert res_json.status_code == 400, (
                f"Expected HTTP 400 for JSON base64 truncated JPEG ({cut} bytes missing), "
                f"got {res_json.status_code}. Response: {res_json.text}"
            )
            detail_json = res_json.json().get("detail", "").lower()
            assert any(word in detail_json for word in ["truncated", "corrupt", "invalid", "failed"])


@pytest.mark.anyio
async def test_suncalc_malformed_time_unhandled_500_vulnerability():
    """Verify that malformed, single-part, or non-numeric time strings in /api/forensics/suncalc
    are cleanly rejected with HTTP 400 or HTTP 422 client error, never HTTP 500.
    """
    malformed_time_samples = [
        "12",          # Single-part number without colon (previously triggered IndexError)
        "09",          # Leading zero single-part
        "12:",         # Trailing colon missing minutes
        ":30",         # Leading colon missing hours
        "25:00",       # Out of range hour (> 23)
        "12:60",       # Out of range minute (> 59)
        "12:30:99",    # Out of range second (> 59)
        "abc:def",     # Non-numeric string
        "12:30:45:99", # Too many time parts
        "invalid",     # Arbitrary text
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for bad_time in malformed_time_samples:
            res = await client.post(
                "/api/forensics/suncalc",
                json={
                    "latitude": 21.0285,
                    "longitude": 105.8542,
                    "date": "2024-05-15",
                    "time": bad_time,
                },
            )
            assert res.status_code in (400, 422), (
                f"Expected HTTP 400 or 422 for malformed time {bad_time!r}, "
                f"got {res.status_code}. Response: {res.text}"
            )
            assert res.status_code != 500, (
                f"VULNERABILITY: HTTP 500 unhandled crash on time {bad_time!r}: {res.text}"
            )

        # Confirm valid time strings continue to pass with HTTP 200
        valid_times = ["12:00", "08:30:00", "23:59:59", "00:00:00"]
        for good_time in valid_times:
            res_good = await client.post(
                "/api/forensics/suncalc",
                json={
                    "latitude": 21.0285,
                    "longitude": 105.8542,
                    "date": "2024-05-15",
                    "time": good_time,
                },
            )
            assert res_good.status_code == 200, (
                f"Valid time {good_time!r} failed with {res_good.status_code}: {res_good.text}"
            )

