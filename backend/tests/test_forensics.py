"""Comprehensive test suite for Photo Forensics Studio API.

Covers:
- EXIF & GPS extraction (with DMS decimal conversion and map links)
- Safely handling non-EXIF, PNG, WEBP, and corrupt images
- Filename digital fingerprint decoders (Facebook, Zalo, Telegram, Camera)
- Error Level Analysis (ELA) with clean and spliced JPEG images, difference map, and JET heatmap
- Dual-input ingestion (multipart/form-data and application/json base64)
- Astronomical NOAA solar position calculation and reverse chronolocation solver
"""

import base64
import io
from fractions import Fraction
from typing import Tuple

import pytest
from httpx import ASGITransport, AsyncClient
from PIL import ExifTags, Image
from PIL.TiffImagePlugin import IFDRational

from app.main import app


def _create_synthetic_exif_jpeg() -> bytes:
    """Generate a synthetic JPEG image containing realistic EXIF and GPS tags."""
    img = Image.new("RGB", (160, 120), color=(120, 160, 200))
    exif = img.getexif()

    # Base IFD
    exif[ExifTags.Base.Make] = "Sony"
    exif[ExifTags.Base.Model] = "ILCE-7M4"
    exif[ExifTags.Base.Software] = "Adobe Photoshop 2024"
    exif[ExifTags.Base.Orientation] = 1

    # Exif Sub-IFD
    exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
    exif_ifd[ExifTags.Base.DateTimeOriginal] = "2024:05:15 11:30:00"
    exif_ifd[ExifTags.Base.DateTimeDigitized] = "2024:05:15 11:30:00"
    exif_ifd[ExifTags.Base.ExposureTime] = IFDRational(1, 250)
    exif_ifd[ExifTags.Base.FNumber] = IFDRational(28, 10)
    exif_ifd[ExifTags.Base.ISOSpeedRatings] = 100
    exif_ifd[ExifTags.Base.FocalLength] = IFDRational(50, 1)
    exif_ifd[0xA434] = "FE 24-70mm F2.8 GM"

    # GPS Sub-IFD: Ho Chi Minh City coordinates (10 deg 45 min 36 sec N, 106 deg 42 min 3 sec E)
    gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps_ifd[ExifTags.GPS.GPSLatitude] = (IFDRational(10, 1), IFDRational(45, 1), IFDRational(36, 1))
    gps_ifd[ExifTags.GPS.GPSLatitudeRef] = "N"
    gps_ifd[ExifTags.GPS.GPSLongitude] = (IFDRational(106, 1), IFDRational(42, 1), IFDRational(3, 1))
    gps_ifd[ExifTags.GPS.GPSLongitudeRef] = "E"
    gps_ifd[ExifTags.GPS.GPSAltitude] = IFDRational(15, 1)
    gps_ifd[ExifTags.GPS.GPSAltitudeRef] = 0
    gps_ifd[ExifTags.GPS.GPSDateStamp] = "2024:05:15"
    gps_ifd[ExifTags.GPS.GPSTimeStamp] = (IFDRational(4, 1), IFDRational(30, 1), IFDRational(0, 1))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


def _create_clean_jpeg() -> bytes:
    """Generate a clean JPEG without any metadata."""
    img = Image.new("RGB", (100, 100), color=(80, 120, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def _create_spliced_jpeg() -> bytes:
    """Generate a spliced JPEG image with distinct compression history in different regions."""
    # Pre-compressed background at low quality
    bg = Image.new("RGB", (200, 200), color=(100, 100, 100))
    buf_bg = io.BytesIO()
    bg.save(buf_bg, format="JPEG", quality=60)
    bg_loaded = Image.open(io.BytesIO(buf_bg.getvalue()))

    # Uncompressed vibrant patch pasted onto background
    patch = Image.new("RGB", (60, 60), color=(255, 240, 0))
    bg_loaded.paste(patch, (70, 70))

    # Recompressed at high quality
    buf_final = io.BytesIO()
    bg_loaded.save(buf_final, format="JPEG", quality=95)
    return buf_final.getvalue()


@pytest.mark.anyio
async def test_analyze_multipart_synthetic_exif_gps():
    """Test /api/forensics/analyze with synthetic JPEG containing EXIF, GPS, and software tags."""
    img_bytes = _create_synthetic_exif_jpeg()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("sony_hcmc_test.jpg", img_bytes, "image/jpeg")}
        res = await client.post("/api/forensics/analyze", files=files)

        assert res.status_code == 200, res.text
        data = res.json()

        assert data["status"] == "success"
        assert data["filename"] == "sony_hcmc_test.jpg"

        # File info verification
        file_info = data["file_info"]
        assert file_info["format"] == "JPEG"
        assert file_info["width"] == 160
        assert file_info["height"] == 120
        assert len(file_info["md5"]) == 32
        assert len(file_info["sha256"]) == 64

        # Camera EXIF verification
        exif = data["exif"]
        assert exif["has_exif"] is True
        assert exif["make"] == "Sony"
        assert exif["model"] == "ILCE-7M4"
        assert exif["software"] == "Adobe Photoshop 2024"
        assert exif["datetime_original"] == "2024:05:15 11:30:00"
        assert exif["exposure_time"] == "1/250s"
        assert exif["f_number"] == "f/2.8"
        assert exif["iso"] == 100
        assert exif["focal_length"] == "50.0mm"
        assert exif["lens_model"] == "FE 24-70mm F2.8 GM"

        # GPS decimal verification
        gps = data["gps"]
        assert gps["has_gps"] is True
        assert abs(gps["latitude"] - 10.760000) < 0.0001
        assert abs(gps["longitude"] - 106.700833) < 0.0001
        assert gps["altitude"] == 15.0
        assert "google.com/maps?q=10.760000,106.700833" in gps["google_maps_url"]
        assert "openstreetmap.org/?mlat=10.760000&mlon=106.700833" in gps["osm_url"]

        # Tampering indicators
        indicators = data["tampering_indicators"]
        assert indicators["software_detected"] is True
        assert "Adobe Photoshop 2024" in indicators["software_name"]
        assert data["software_tampering_score"] >= 45.0


@pytest.mark.anyio
async def test_analyze_image_without_exif():
    """Test /api/forensics/analyze with clean image stripped of all EXIF tags."""
    img_bytes = _create_clean_jpeg()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("stripped_photo.jpg", img_bytes, "image/jpeg")}
        res = await client.post("/api/forensics/analyze", files=files)

        assert res.status_code == 200, res.text
        data = res.json()

        assert data["status"] == "success"
        assert data["exif"]["has_exif"] is False
        assert data["gps"]["has_gps"] is False
        assert data["file_info"]["width"] == 100
        assert data["file_info"]["height"] == 100
        assert data["tampering_indicators"]["exif_scrubbed"] is True


@pytest.mark.anyio
async def test_analyze_png_and_webp():
    """Test /api/forensics/analyze safely handles non-JPEG formats (PNG with alpha and WebP)."""
    # 1. PNG with alpha
    png_img = Image.new("RGBA", (80, 80), color=(255, 0, 0, 128))
    png_buf = io.BytesIO()
    png_img.save(png_buf, format="PNG")
    png_bytes = png_buf.getvalue()

    # 2. WebP
    webp_img = Image.new("RGB", (64, 64), color=(0, 255, 128))
    webp_buf = io.BytesIO()
    webp_img.save(webp_buf, format="WEBP")
    webp_bytes = webp_buf.getvalue()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test PNG
        res_png = await client.post(
            "/api/forensics/analyze",
            files={"file": ("alpha_badge.png", png_bytes, "image/png")},
        )
        assert res_png.status_code == 200
        data_png = res_png.json()
        assert data_png["file_info"]["format"] == "PNG"
        assert data_png["file_info"]["mode"] == "RGBA"

        # Test WebP
        res_webp = await client.post(
            "/api/forensics/analyze",
            files={"file": ("graphic.webp", webp_bytes, "image/webp")},
        )
        assert res_webp.status_code == 200
        data_webp = res_webp.json()
        assert data_webp["file_info"]["format"] == "WEBP"


@pytest.mark.anyio
async def test_analyze_base64_json():
    """Test /api/forensics/analyze dual ingestion with base64 JSON payload."""
    img_bytes = _create_clean_jpeg()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"image_base64": b64_str, "filename": "clipboard_paste.jpg"}
        res = await client.post("/api/forensics/analyze", json=payload)

        assert res.status_code == 200, res.text
        data = res.json()
        assert data["filename"] == "clipboard_paste.jpg"
        assert data["file_info"]["format"] == "JPEG"


@pytest.mark.anyio
async def test_analyze_corrupt_and_empty_images():
    """Test /api/forensics/analyze returns 400 for empty or corrupted images."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Empty file
        res_empty = await client.post(
            "/api/forensics/analyze",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
        )
        assert res_empty.status_code == 400

        # Corrupt bytes
        res_corrupt = await client.post(
            "/api/forensics/analyze",
            files={"file": ("corrupt.jpg", b"NOT_AN_IMAGE_RANDOM_GARBAGE_123456", "image/jpeg")},
        )
        assert res_corrupt.status_code == 400

        # Invalid base64 in JSON
        res_bad_b64 = await client.post(
            "/api/forensics/analyze",
            json={"image_base64": "invalid_base64_string", "filename": "bad.jpg"},
        )
        assert res_bad_b64.status_code == 400


@pytest.mark.anyio
async def test_filename_fingerprint_decoders():
    """Test decoding digital fingerprint patterns from social platforms and camera filenames."""
    img_bytes = _create_clean_jpeg()

    cases = [
        (
            "12345678_10203040506070809_1234567890123456789_n.jpg",
            "Facebook",
            "10203040506070809",
            "12345678",
        ),
        (
            "FB_IMG_1715783400000.jpg",
            "Facebook",
            None,
            None,
        ),
        (
            "received_10203040506070809.jpeg",
            "Facebook",
            "10203040506070809",
            None,
        ),
        (
            "1698048000000_photo.jpg",
            "Zalo",
            None,
            None,
        ),
        (
            "zalo_1715783400.jpg",
            "Zalo",
            None,
            None,
        ),
        (
            "photo_2023-10-23_12-30-45.jpg",
            "Telegram",
            None,
            None,
        ),
        (
            "IMG_20241023_133000.jpg",
            "Camera / Device",
            None,
            None,
        ),
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for filename, expected_platform, expected_photo_id, expected_user_id in cases:
            files = {"file": (filename, img_bytes, "image/jpeg")}
            res = await client.post("/api/forensics/analyze", files=files)
            assert res.status_code == 200
            fp = res.json()["fingerprint"]
            assert fp["matched"] is True
            assert fp["platform"] == expected_platform
            if expected_photo_id:
                assert fp["photo_id"] == expected_photo_id
            if expected_user_id:
                assert fp["user_id"] == expected_user_id


@pytest.mark.anyio
async def test_ela_multipart_default_params():
    """Test /api/forensics/ela multipart upload with default parameters."""
    img_bytes = _create_clean_jpeg()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("test_ela.jpg", img_bytes, "image/jpeg")}
        data_form = {"quality": "90", "scale": "15.0", "colormap": "jet"}
        res = await client.post("/api/forensics/ela", files=files, data=data_form)

        assert res.status_code == 200, res.text
        data = res.json()

        assert data["status"] == "success"
        assert data["quality"] == 90
        assert data["scale"] == 15.0
        assert data["ela_image_base64"].startswith("data:image/png;base64,")
        assert data["heatmap_base64"].startswith("data:image/png;base64,")

        stats = data["statistics"]
        assert stats["mean_difference"] >= 0.0
        assert stats["max_difference"] >= 0.0
        assert stats["manipulation_risk"] in ("low", "medium", "high")


@pytest.mark.anyio
async def test_ela_splicing_detection():
    """Test /api/forensics/ela accurately flags a spliced/manipulated image with high error difference."""
    spliced_bytes = _create_spliced_jpeg()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("spliced_manipulation.jpg", spliced_bytes, "image/jpeg")}
        res = await client.post("/api/forensics/ela", files=files)

        assert res.status_code == 200, res.text
        data = res.json()
        stats = data["statistics"]

        # The spliced patch causes high error discontinuity
        assert stats["max_difference"] > 25.0
        assert stats["tampering_detected"] is True
        assert stats["manipulation_risk"] in ("medium", "high")


@pytest.mark.anyio
async def test_ela_base64_json():
    """Test /api/forensics/ela with application/json base64 payload."""
    img_bytes = _create_clean_jpeg()
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "image_base64": b64_str,
            "filename": "ela_json.jpg",
            "quality": 88,
            "scale": 18.0,
            "colormap": "inferno",
        }
        res = await client.post("/api/forensics/ela", json=payload)

        assert res.status_code == 200, res.text
        data = res.json()
        assert data["quality"] == 88
        assert data["scale"] == 18.0
        assert data["colormap"] == "inferno"
        assert data["ela_data_url"].startswith("data:image/png;base64,")
        assert data["heatmap_data_url"].startswith("data:image/png;base64,")


@pytest.mark.anyio
async def test_suncalc_forward_calculation():
    """Test /api/forensics/suncalc forward solar position for Hanoi on summer solstice."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "latitude": 21.0285,
            "longitude": 105.8542,
            "date": "2024-06-21",
            "time": "05:00:00",  # 05:00 UTC = 12:00 Local time in Hanoi (UTC+7)
        }
        res = await client.post("/api/forensics/suncalc", json=payload)

        assert res.status_code == 200, res.text
        data = res.json()

        assert data["status"] == "success"
        assert data["latitude"] == 21.0285
        assert data["longitude"] == 105.8542
        assert data["date"] == "2024-06-21"

        # Solar altitude at midday during summer solstice in Hanoi is near zenith (> 80 deg)
        assert data["solar_altitude_deg"] > 80.0
        assert data["solar_position"]["is_daylight"] is True

        # Solar events
        events = data["solar_events"]
        assert events["solar_noon"] is not None
        assert "04:" in events["solar_noon"] or "05:" in events["solar_noon"]
        assert events["daylight_duration_hours"] > 12.0

        # 24-hour path curve (every 30 min = 48 points)
        assert len(data["solar_path_24h"]) == 48


@pytest.mark.anyio
async def test_suncalc_reverse_chronolocation():
    """Test /api/forensics/suncalc chronolocation solver estimating capture time from shadow direction."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Shadow pointing Northeast (45 deg) -> Sun in Southwest (225 deg)
        # In London on May 15, Sun is in SW in early afternoon (~13:00 to 15:00)
        payload = {
            "latitude": 51.5074,
            "longitude": -0.1278,
            "date": "2024-05-15",
            "shadow_azimuth": 45.0,
        }
        res = await client.post("/api/forensics/suncalc", json=payload)

        assert res.status_code == 200, res.text
        data = res.json()

        chrono = data["chronolocation"]
        assert chrono is not None
        assert chrono["target_shadow_azimuth"] == 45.0
        assert chrono["target_sun_azimuth"] == 225.0

        # Estimated local time should be in the afternoon
        local_time = chrono["estimated_local_time"]
        hour = int(local_time.split(":")[0])
        assert 12 <= hour <= 16
        assert chrono["confidence"] in ("high", "medium")


@pytest.mark.anyio
async def test_suncalc_validation_and_errors():
    """Test /api/forensics/suncalc validation on out-of-range coordinates and invalid dates."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Latitude > 90
        res_lat = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 95.0, "longitude": 100.0, "date": "2024-05-15"},
        )
        assert res_lat.status_code == 422

        # Longitude > 180
        res_lon = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 10.0, "longitude": 195.0, "date": "2024-05-15"},
        )
        assert res_lon.status_code == 422

        # Invalid date format
        res_date = await client.post(
            "/api/forensics/suncalc",
            json={"latitude": 10.0, "longitude": 100.0, "date": "2024-99-99"},
        )
        assert res_date.status_code == 422
