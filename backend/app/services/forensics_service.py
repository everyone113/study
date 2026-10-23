"""Forensics Service: Pure business logic for metadata extraction, ELA, and NOAA Solar Chronolocation."""

import base64
import hashlib
import io
import math
import re
import time
from datetime import datetime, timezone, timedelta, date
from fractions import Fraction
from typing import Optional, Dict, Any, List, Tuple, Union

import numpy as np
import cv2
from PIL import Image, ExifTags, IptcImagePlugin
from PIL.TiffImagePlugin import IFDRational

from app.models.forensics import (
    FileInfo,
    CameraInfo,
    GPSInfo,
    FilenameFingerprint,
    TamperingIndicators,
    ForensicsAnalyzeResponse,
    ELAStatistics,
    ELAResponse,
    SolarPosition,
    ChronolocationEstimate,
    SolarEvents,
    SunCalcResponse,
)


def _safe_float(val: Any) -> Optional[float]:
    """Safely convert rational, IFDRational, Fraction, or tuple to float."""
    if val is None:
        return None
    try:
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, (IFDRational, Fraction)):
            return float(val)
        if isinstance(val, (tuple, list)) and len(val) >= 2:
            denom = float(val[1])
            if denom != 0:
                return float(val[0]) / denom
        return float(val)
    except (ValueError, TypeError, ZeroDivisionError):
        return None


def _parse_dms_to_decimal(dms: Any, ref: Optional[str]) -> Optional[float]:
    """Convert EXIF DMS tuple (degrees, minutes, seconds) to signed decimal float."""
    if not dms or not isinstance(dms, (tuple, list)) or len(dms) < 3:
        return None

    try:
        deg = _safe_float(dms[0])
        minute = _safe_float(dms[1])
        sec = _safe_float(dms[2])

        if deg is None or minute is None or sec is None:
            return None

        decimal = deg + (minute / 60.0) + (sec / 3600.0)
        if ref and str(ref).strip().upper() in ("S", "W"):
            decimal = -decimal
        return round(decimal, 6)
    except Exception:
        return None


def _parse_altitude(alt: Any, ref: Any) -> Optional[float]:
    """Convert EXIF altitude to signed float in meters."""
    if alt is None:
        return None
    try:
        val = _safe_float(alt)
        if val is None:
            return None
        # In EXIF: GPSAltitudeRef 1 means below sea level
        if ref in (1, b"\x01", "1", "b'\\x01'"):
            val = -val
        return round(val, 2)
    except Exception:
        return None


def _format_exposure_time(val: Any) -> Optional[str]:
    """Format exposure time nicely, e.g., 1/250s or 2.5s."""
    f = _safe_float(val)
    if f is None or f <= 0:
        return None
    if f < 1.0:
        inv = round(1.0 / f)
        return f"1/{inv}s"
    if f == int(f):
        return f"{int(f)}s"
    return f"{round(f, 2)}s"


def _format_f_number(val: Any) -> Optional[str]:
    """Format aperture nicely, e.g., f/2.8."""
    f = _safe_float(val)
    if f is None or f <= 0:
        return None
    return f"f/{round(f, 1)}"


def _format_focal_length(val: Any) -> Optional[str]:
    """Format focal length nicely, e.g., 50.0mm."""
    f = _safe_float(val)
    if f is None or f <= 0:
        return None
    return f"{round(f, 1)}mm"


def _extract_xmp(image: Image.Image, image_bytes: bytes) -> Dict[str, Any]:
    """Extract XMP metadata dictionary from Pillow info or raw byte scanning."""
    xmp_data: Dict[str, Any] = {}
    xmp_raw = image.info.get("xmp") or image.info.get("XML:com.adobe.xmp")

    if not xmp_raw:
        # Search in raw bytes for <x:xmpmeta> block
        idx_start = image_bytes.find(b"<x:xmpmeta")
        if idx_start != -1:
            idx_end = image_bytes.find(b"</x:xmpmeta>", idx_start)
            if idx_end != -1:
                xmp_raw = image_bytes[idx_start : idx_end + len(b"</x:xmpmeta>")]

    if xmp_raw:
        try:
            if isinstance(xmp_raw, bytes):
                xmp_str = xmp_raw.decode("utf-8", errors="ignore")
            else:
                xmp_str = str(xmp_raw)

            patterns = {
                "creator_tool": r"xmp:CreatorTool=[\"']([^\"']+)[\"']|<xmp:CreatorTool>([^<]+)</xmp:CreatorTool>",
                "create_date": r"xmp:CreateDate=[\"']([^\"']+)[\"']|<xmp:CreateDate>([^<]+)</xmp:CreateDate>",
                "modify_date": r"xmp:ModifyDate=[\"']([^\"']+)[\"']|<xmp:ModifyDate>([^<]+)</xmp:ModifyDate>",
                "metadata_date": r"xmp:MetadataDate=[\"']([^\"']+)[\"']|<xmp:MetadataDate>([^<]+)</xmp:MetadataDate>",
                "document_id": r"xmpMM:DocumentID=[\"']([^\"']+)[\"']|<xmpMM:DocumentID>([^<]+)</xmpMM:DocumentID>",
                "instance_id": r"xmpMM:InstanceID=[\"']([^\"']+)[\"']|<xmpMM:InstanceID>([^<]+)</xmpMM:InstanceID>",
                "format": r"dc:format=[\"']([^\"']+)[\"']|<dc:format>([^<]+)</dc:format>",
            }
            for key, pat in patterns.items():
                m = re.search(pat, xmp_str, re.IGNORECASE)
                if m:
                    xmp_data[key] = m.group(1) or m.group(2)
        except Exception:
            pass

    return xmp_data


def _extract_iptc(image: Image.Image) -> Dict[str, Any]:
    """Extract IPTC metadata from Pillow."""
    iptc_data: Dict[str, Any] = {}
    try:
        raw_iptc = IptcImagePlugin.getiptcinfo(image)
        if raw_iptc:
            for k, v in raw_iptc.items():
                key_name = str(k)
                if isinstance(v, bytes):
                    iptc_data[key_name] = v.decode("utf-8", errors="ignore")
                elif isinstance(v, list):
                    iptc_data[key_name] = [
                        item.decode("utf-8", errors="ignore") if isinstance(item, bytes) else str(item)
                        for item in v
                    ]
                else:
                    iptc_data[key_name] = str(v)
    except Exception:
        pass
    return iptc_data


def _decode_filename_fingerprint(filename: str) -> FilenameFingerprint:
    """Decode digital fingerprint markers from image filenames (Facebook, Zalo, Telegram, Camera)."""
    if not filename:
        return FilenameFingerprint()

    base_name = filename.split("/")[-1].split("\\")[-1]

    # 1. Facebook Classic CDN 3-part or 4-part: e.g. 12345678_10203040506070809_1234567890123456789_n.jpg
    m_fb_cdn = re.match(
        r"^(\d{6,16})_(\d{10,20})_(\d{10,20})_([anoqs])\.(jpe?g|png|webp)$",
        base_name,
        re.IGNORECASE,
    )
    if m_fb_cdn:
        user_id = m_fb_cdn.group(1)
        photo_id = m_fb_cdn.group(2)
        seq_id = m_fb_cdn.group(3)
        suffix = m_fb_cdn.group(4).lower()

        ts: Optional[int] = None
        iso_str: Optional[str] = None
        if len(seq_id) == 10 and 1000000000 <= int(seq_id) <= 2100000000:
            ts = int(seq_id)
            iso_str = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

        links = [
            f"https://www.facebook.com/photo.php?fbid={photo_id}",
            f"https://www.facebook.com/{user_id}",
        ]
        return FilenameFingerprint(
            matched=True,
            platform="Facebook",
            pattern_name="Facebook Classic CDN",
            photo_id=photo_id,
            user_id=user_id,
            unix_timestamp=ts,
            detected_timestamp=ts,
            iso_datetime=iso_str,
            extracted_datetime=iso_str,
            details={"suffix_type": suffix, "checksum_seq": seq_id},
            osint_links=links,
            confidence="high",
            description=f"Facebook CDN Photo ID {photo_id} uploaded by account/album {user_id}",
        )

    # 2. Facebook Mobile Save: e.g. FB_IMG_1715783400000.jpg or FB_IMG_1715783400.jpg
    m_fb_img = re.match(
        r"^FB_IMG_(\d{10,13})\.(jpe?g|png|webp)$",
        base_name,
        re.IGNORECASE,
    )
    if m_fb_img:
        digits = m_fb_img.group(1)
        ts = int(digits)
        if len(digits) == 13:
            ts //= 1000
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        iso_str = dt.isoformat()
        return FilenameFingerprint(
            matched=True,
            platform="Facebook",
            pattern_name="Facebook Mobile Save (FB_IMG)",
            unix_timestamp=ts,
            detected_timestamp=ts,
            iso_datetime=iso_str,
            extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
            details={"raw_digits": digits},
            osint_links=[],
            confidence="high",
            description=f"Facebook Mobile download timestamp decoded: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        )

    # 3. Facebook Messenger Download: e.g. received_10203040506070809.jpeg
    m_fb_recv = re.match(
        r"^received_(\d{10,20})\.(jpe?g|png|webp)$",
        base_name,
        re.IGNORECASE,
    )
    if m_fb_recv:
        photo_id = m_fb_recv.group(1)
        return FilenameFingerprint(
            matched=True,
            platform="Facebook",
            pattern_name="Facebook Messenger Attachment",
            photo_id=photo_id,
            details={"attachment_id": photo_id},
            osint_links=[f"https://www.facebook.com/photo.php?fbid={photo_id}"],
            confidence="high",
            description=f"Facebook Messenger attachment ID: {photo_id}",
        )

    # 4. Zalo Millisecond / Epoch timestamp: e.g. 1698048000000_photo.jpg or zalo_1715783400.jpg
    m_zalo_ms = (
        re.match(r"^(\d{13})_.*\.(jpe?g|png|webp)$", base_name, re.IGNORECASE)
        or re.match(r"^zalo_(\d{10,13})\.(jpe?g|png|webp)$", base_name, re.IGNORECASE)
    )
    if m_zalo_ms:
        digits = m_zalo_ms.group(1)
        ts = int(digits)
        if len(digits) == 13:
            ts //= 1000
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        iso_str = dt.isoformat()
        return FilenameFingerprint(
            matched=True,
            platform="Zalo",
            pattern_name="Zalo Image Timestamp",
            unix_timestamp=ts,
            detected_timestamp=ts,
            iso_datetime=iso_str,
            extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
            details={"raw_digits": digits},
            confidence="high",
            description=f"Zalo upload/download timestamp decoded: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        )

    # 5. Telegram Desktop export: e.g. photo_2023-10-23_12-30-45.jpg
    m_tg_dt = re.match(
        r"^photo_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.(jpe?g|png|webp)$",
        base_name,
        re.IGNORECASE,
    )
    if m_tg_dt:
        try:
            tg_groups = m_tg_dt.groups()
            if len(tg_groups) >= 6:
                y, m, d, h, mi, s = map(int, tg_groups[:6])
                dt = datetime(y, m, d, h, mi, s, tzinfo=timezone.utc)
                ts = int(dt.timestamp())
                iso_str = dt.isoformat()
                return FilenameFingerprint(
                    matched=True,
                    platform="Telegram",
                    pattern_name="Telegram Desktop Export",
                    unix_timestamp=ts,
                    detected_timestamp=ts,
                    iso_datetime=iso_str,
                    extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    details={"year": y, "month": m, "day": d},
                    confidence="high",
                    description=f"Telegram Desktop photo export captured on {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}",
                )
        except Exception:
            pass

    # 6. Telegram Cloud / General: e.g. telegram_1715783400.jpg or photo_1715783400.jpg
    m_tg_gen = re.search(r"(?:telegram|tg|photo)[_-](\d{10,13})", base_name, re.IGNORECASE)
    if m_tg_gen:
        digits = m_tg_gen.group(1)
        ts = int(digits)
        if len(digits) == 13:
            ts //= 1000
        if 1400000000 <= ts <= 2100000000:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            iso_str = dt.isoformat()
            return FilenameFingerprint(
                matched=True,
                platform="Telegram",
                pattern_name="Telegram Epoch Timestamp",
                unix_timestamp=ts,
                detected_timestamp=ts,
                iso_datetime=iso_str,
                extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
                confidence="medium",
                description=f"Telegram file timestamp: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}",
            )

    # 7. Camera / Device capture pattern: e.g. IMG_20241023_133000.jpg or PXL_20241023_133000.jpg
    m_cam = re.match(
        r"^(?:IMG|PXL|Screenshot|Camera|zalo)_?(\d{4})(\d{2})(\d{2})_?(\d{2})(\d{2})(\d{2})",
        base_name,
        re.IGNORECASE,
    )
    if m_cam:
        prefix = base_name.split("_")[0].lower()
        platform_name = "Zalo" if "zalo" in prefix else "Camera / Device"
        try:
            y, m, d, h, mi, s = map(int, m_cam.groups()[:6])
            dt = datetime(y, m, d, h, mi, s, tzinfo=timezone.utc)
            ts = int(dt.timestamp())
            iso_str = dt.isoformat()
            return FilenameFingerprint(
                matched=True,
                platform=platform_name,
                pattern_name="Formatted Capture Timestamp",
                unix_timestamp=ts,
                detected_timestamp=ts,
                iso_datetime=iso_str,
                extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
                confidence="high",
                description=f"{platform_name} capture timestamp: {dt.strftime('%Y-%m-%d %H:%M:%S')}",
            )
        except Exception:
            pass

    # 8. Generic Unix Epoch Fallback (between 2017 and 2036)
    m_epoch = re.search(r"(?:^|[^\d])(1[5-9]\d{8}|20\d{8})(?:[^\d]|$)", base_name)
    if m_epoch:
        ts = int(m_epoch.group(1))
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        iso_str = dt.isoformat()
        return FilenameFingerprint(
            matched=True,
            platform="Generic Unix Timestamp",
            pattern_name="Epoch Timestamp",
            unix_timestamp=ts,
            detected_timestamp=ts,
            iso_datetime=iso_str,
            extracted_datetime=dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
            confidence="low",
            description=f"Embedded Unix epoch timestamp: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        )

    return FilenameFingerprint(matched=False, platform="Unknown", confidence="none")


def _evaluate_software_tampering(
    software: Optional[str],
    creator_tool: Optional[str],
    has_exif: bool,
    format_name: str,
) -> Tuple[float, TamperingIndicators]:
    """Inspect software strings and EXIF completeness to evaluate potential manipulation."""
    warnings: List[str] = []
    editing_tools = [
        "photoshop",
        "gimp",
        "lightroom",
        "snapseed",
        "canva",
        "procreate",
        "vsco",
        "pixlr",
        "affinity",
        "paint.net",
    ]

    software_detected = False
    software_name: Optional[str] = None
    score = 0.0

    combined_software = f"{software or ''} {creator_tool or ''}".lower()
    for tool in editing_tools:
        if tool in combined_software:
            software_detected = True
            software_name = software or creator_tool
            warnings.append(f"Image edited with software: {software_name}")
            score += 45.0
            break

    exif_scrubbed = False
    if format_name.upper() == "JPEG" and not has_exif:
        exif_scrubbed = True
        warnings.append("JPEG image lacks EXIF metadata; metadata may have been stripped.")
        score += 20.0

    score = min(100.0, score)
    indicators = TamperingIndicators(
        software_detected=software_detected,
        software_name=software_name,
        exif_scrubbed=exif_scrubbed,
        score=score,
        warnings=warnings,
    )
    return score, indicators


def extract_metadata(image_bytes: bytes, filename: str = "image.jpg") -> ForensicsAnalyzeResponse:
    """Extract metadata, EXIF, GPS coordinates, IPTC, XMP, and filename fingerprint."""
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Empty image data provided")

    md5_hash = hashlib.md5(image_bytes).hexdigest()
    sha256_hash = hashlib.sha256(image_bytes).hexdigest()
    size_bytes = len(image_bytes)

    try:
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        format_name = image.format or (filename.split(".")[-1].upper() if "." in filename else "JPEG")
        mode = image.mode
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image format: {str(e)}")

    # Extract EXIF
    has_exif = False
    raw_exif: Dict[str, Any] = {}
    camera = CameraInfo()
    gps = GPSInfo()

    try:
        exif_obj = image.getexif()
        if exif_obj and len(exif_obj) > 0:
            has_exif = True

            # 1. Base IFD tags
            for tag_id, value in exif_obj.items():
                tag_name = ExifTags.TAGS.get(tag_id, hex(tag_id))
                raw_exif[tag_name] = str(value)

            camera.make = exif_obj.get(ExifTags.Base.Make)
            camera.model = exif_obj.get(ExifTags.Base.Model)
            camera.software = exif_obj.get(ExifTags.Base.Software)
            camera.datetime_modified = exif_obj.get(ExifTags.Base.DateTime)
            camera.orientation = exif_obj.get(ExifTags.Base.Orientation)
            if camera.orientation:
                orientations = {
                    1: "Normal (0 deg)",
                    3: "Rotated 180 deg",
                    6: "Rotated 90 deg CW",
                    8: "Rotated 90 deg CCW",
                }
                camera.orientation_desc = orientations.get(camera.orientation, f"Code {camera.orientation}")

            # 2. Exif sub-IFD
            try:
                exif_ifd = exif_obj.get_ifd(ExifTags.IFD.Exif)
                if exif_ifd:
                    for sub_id, sub_val in exif_ifd.items():
                        sub_name = ExifTags.TAGS.get(sub_id, hex(sub_id))
                        raw_exif[sub_name] = str(sub_val)

                    camera.datetime_original = exif_ifd.get(ExifTags.Base.DateTimeOriginal)
                    camera.datetime_digitized = exif_ifd.get(ExifTags.Base.DateTimeDigitized)
                    camera.lens_make = exif_ifd.get(0xA433)
                    camera.lens_model = exif_ifd.get(0xA434)
                    camera.iso = exif_ifd.get(ExifTags.Base.ISOSpeedRatings) or exif_ifd.get(0x8833)
                    camera.exposure_time = _format_exposure_time(exif_ifd.get(ExifTags.Base.ExposureTime))
                    camera.f_number = _format_f_number(exif_ifd.get(ExifTags.Base.FNumber))
                    camera.focal_length = _format_focal_length(exif_ifd.get(ExifTags.Base.FocalLength))
                    camera.focal_length_35mm = _format_focal_length(exif_ifd.get(0xA405))
                    camera.flash = exif_ifd.get(ExifTags.Base.Flash)
                    camera.white_balance = exif_ifd.get(ExifTags.Base.WhiteBalance)
                    camera.metering_mode = exif_ifd.get(ExifTags.Base.MeteringMode)
                    camera.timezone_offset = exif_ifd.get(0x9010) or exif_ifd.get(0x9011)
            except Exception:
                pass

            # 3. GPS sub-IFD
            try:
                gps_ifd = exif_obj.get_ifd(ExifTags.IFD.GPSInfo)
                if gps_ifd:
                    for gps_id, gps_val in gps_ifd.items():
                        gps_tag_name = ExifTags.GPSTAGS.get(gps_id, hex(gps_id))
                        raw_exif[f"GPS_{gps_tag_name}"] = str(gps_val)

                    lat_dms = gps_ifd.get(ExifTags.GPS.GPSLatitude)
                    lat_ref = gps_ifd.get(ExifTags.GPS.GPSLatitudeRef)
                    lon_dms = gps_ifd.get(ExifTags.GPS.GPSLongitude)
                    lon_ref = gps_ifd.get(ExifTags.GPS.GPSLongitudeRef)
                    alt_val = gps_ifd.get(ExifTags.GPS.GPSAltitude)
                    alt_ref = gps_ifd.get(ExifTags.GPS.GPSAltitudeRef)

                    lat = _parse_dms_to_decimal(lat_dms, lat_ref)
                    lon = _parse_dms_to_decimal(lon_dms, lon_ref)
                    alt = _parse_altitude(alt_val, alt_ref)

                    if lat is not None and lon is not None:
                        gps.has_gps = True
                        gps.latitude = lat
                        gps.longitude = lon
                        gps.altitude = alt
                        gps.latitude_ref = str(lat_ref) if lat_ref else None
                        gps.longitude_ref = str(lon_ref) if lon_ref else None
                        gps.altitude_ref = str(alt_ref) if alt_ref is not None else None
                        gps.google_maps_url = f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}"
                        gps.osm_url = (
                            f"https://www.openstreetmap.org/?mlat={lat:.6f}&mlon={lon:.6f}#map=16/{lat:.6f}/{lon:.6f}"
                        )

                        # GPS timestamp
                        date_stamp = gps_ifd.get(ExifTags.GPS.GPSDateStamp)
                        time_stamp = gps_ifd.get(ExifTags.GPS.GPSTimeStamp)
                        if date_stamp and time_stamp:
                            try:
                                h_s = int(_safe_float(time_stamp[0]) or 0)
                                m_s = int(_safe_float(time_stamp[1]) or 0)
                                s_s = int(_safe_float(time_stamp[2]) or 0)
                                gps.timestamp_utc = f"{date_stamp} {h_s:02d}:{m_s:02d}:{s_s:02d} UTC"
                            except Exception:
                                pass
            except Exception:
                pass
    except Exception:
        has_exif = False

    camera.has_exif = has_exif

    # IPTC & XMP
    iptc_data = _extract_iptc(image)
    xmp_data = _extract_xmp(image, image_bytes)

    # Filename fingerprint
    fingerprint = _decode_filename_fingerprint(filename)

    # Software tampering heuristics
    software_score, indicators = _evaluate_software_tampering(
        camera.software,
        xmp_data.get("creator_tool"),
        has_exif,
        format_name,
    )

    file_info = FileInfo(
        size_bytes=size_bytes,
        width=width,
        height=height,
        format=format_name,
        mode=mode,
        md5=md5_hash,
        sha256=sha256_hash,
    )

    return ForensicsAnalyzeResponse(
        status="success",
        filename=filename,
        file_info=file_info,
        exif=camera,
        gps=gps,
        iptc=iptc_data,
        xmp=xmp_data,
        fingerprint=fingerprint,
        software_tampering_score=software_score,
        tampering_indicators=indicators,
        camera=camera,
        dimensions={"width": width, "height": height},
        raw_exif=raw_exif,
    )


def compute_error_level_analysis(
    image_bytes: bytes,
    filename: str = "image.jpg",
    quality: int = 90,
    scale: float = 15.0,
    colormap: str = "jet",
) -> ELAResponse:
    """Compute Error Level Analysis (ELA) using in-memory JPEG recompression and OpenCV JET colormap."""
    start_time = time.time()

    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Empty image data provided")

    quality = max(10, min(100, int(quality)))
    scale = max(1.0, min(50.0, float(scale)))

    try:
        orig = Image.open(io.BytesIO(image_bytes))
        width, height = orig.size
        if width <= 0 or height <= 0:
            raise ValueError("Invalid image dimensions: width and height must be positive")
        source_format = orig.format or "JPEG"
        is_lossless = source_format.upper() in ["PNG", "WEBP", "TIFF", "BMP"]

        # Flatten transparency onto white background
        if orig.mode in ("RGBA", "LA") or (orig.mode == "P" and "transparency" in orig.info):
            bg = Image.new("RGB", orig.size, (255, 255, 255))
            mask = orig.split()[-1] if orig.mode in ("RGBA", "LA") else None
            bg.paste(orig, mask=mask)
            orig_rgb = bg
        else:
            orig_rgb = orig.convert("RGB")

        # In-memory JPEG recompression
        recomp_buf = io.BytesIO()
        orig_rgb.save(recomp_buf, format="JPEG", quality=quality)
        recomp_buf.seek(0)
        recomp_rgb = Image.open(recomp_buf).convert("RGB")
    except ValueError:
        raise
    except (ValueError, OSError, SyntaxError, Exception) as e:
        raise ValueError(f"Invalid or corrupted image format: {str(e)}")

    # Pixel difference
    orig_np = np.asarray(orig_rgb, dtype=np.float32)
    recomp_np = np.asarray(recomp_rgb, dtype=np.float32)

    diff = np.abs(orig_np - recomp_np)

    # Scaled color difference
    scaled_diff = np.clip(diff * scale, 0, 255).astype(np.uint8)
    diff_pil = Image.fromarray(scaled_diff)
    ela_png_buf = io.BytesIO()
    diff_pil.save(ela_png_buf, format="PNG")
    ela_data_url = "data:image/png;base64," + base64.b64encode(ela_png_buf.getvalue()).decode("ascii")

    # Grayscale difference & Colormap heatmap
    diff_gray = np.mean(diff, axis=2)
    scaled_gray = np.clip(diff_gray * scale, 0, 255).astype(np.uint8)

    cmap_id = cv2.COLORMAP_JET
    if colormap.lower() == "inferno":
        cmap_id = cv2.COLORMAP_INFERNO
    elif colormap.lower() == "turbo":
        cmap_id = cv2.COLORMAP_TURBO

    heatmap_bgr = cv2.applyColorMap(scaled_gray, cmap_id)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)
    heatmap_pil = Image.fromarray(heatmap_rgb)
    heat_png_buf = io.BytesIO()
    heatmap_pil.save(heat_png_buf, format="PNG")
    heatmap_data_url = "data:image/png;base64," + base64.b64encode(heat_png_buf.getvalue()).decode("ascii")

    # Statistics
    mean_diff = float(np.mean(diff))
    max_diff = float(np.max(diff))
    min_diff = float(np.min(diff))
    std_diff = float(np.std(diff))

    # Macroblock 16x16 hotspot analysis
    block_size = 16
    h_blocks = height // block_size
    w_blocks = width // block_size
    hotspots = 0

    if h_blocks >= 2 and w_blocks >= 2:
        block_means = []
        for i in range(h_blocks):
            for j in range(w_blocks):
                blk = diff_gray[i * block_size : (i + 1) * block_size, j * block_size : (j + 1) * block_size]
                block_means.append(np.mean(blk))
        b_mean = np.mean(block_means)
        b_std = np.std(block_means)
        if b_std > 0.5:
            threshold = b_mean + 3.0 * b_std
            hotspots = int(np.sum(np.array(block_means) > threshold))

    # Anomaly scoring
    anomaly_score = round(min(100.0, (max_diff / 50.0) * 40.0 + (std_diff / 5.0) * 60.0), 2)

    if max_diff >= 35.0 and (std_diff >= 2.0 or hotspots > 0):
        risk = "high"
        tampering = True
        confidence = "high"
        desc = "Significant compression error discontinuities detected consistent with digital splicing or editing."
    elif max_diff >= 20.0 or mean_diff >= 8.0 or hotspots > 0:
        risk = "medium"
        tampering = True
        confidence = "medium"
        desc = "Moderate error level variation detected. Some areas exhibit different compression characteristics."
    else:
        risk = "low"
        tampering = False
        confidence = "low"
        desc = "Uniform error level distribution across the entire frame. No localized splicing detected."

    stats_obj = ELAStatistics(
        mean_difference=round(mean_diff, 2),
        max_difference=round(max_diff, 2),
        min_difference=round(min_diff, 2),
        std_difference=round(std_diff, 2),
        manipulation_risk=risk,
        anomaly_score=anomaly_score,
        tampering_detected=tampering,
        tampering_confidence=confidence,
        tampering_description=desc,
    )

    elapsed = round(time.time() - start_time, 4)

    return ELAResponse(
        status="success",
        original_filename=filename,
        quality=quality,
        scale=scale,
        quality_used=quality,
        scale_used=scale,
        colormap=colormap,
        dimensions={"width": width, "height": height},
        ela_image_base64=ela_data_url,
        heatmap_base64=heatmap_data_url,
        ela_data_url=ela_data_url,
        heatmap_data_url=heatmap_data_url,
        statistics=stats_obj,
        stats=stats_obj,
        metrics={
            "mean_error": round(mean_diff, 2),
            "max_error": round(max_diff, 2),
            "std_error": round(std_diff, 2),
            "hotspot_blocks": float(hotspots),
        },
        is_lossless_source=is_lossless,
        source_format=source_format,
        elapsed_seconds=elapsed,
    )


# ---------------------------------------------------------------------------
# NOAA Solar Position Algorithm & Chronolocation Solver
# ---------------------------------------------------------------------------

def _julian_day_and_epoch(dt_utc: datetime) -> Tuple[float, float]:
    """Calculate Julian Day (JD) and days since J2000.0 epoch."""
    Y = dt_utc.year
    M = dt_utc.month
    D = dt_utc.day
    h = dt_utc.hour
    m = dt_utc.minute
    s = dt_utc.second

    if M <= 2:
        Y -= 1
        M += 12

    A = math.floor(Y / 100)
    B = 2 - A + math.floor(A / 4)
    day_fraction = (h + (m / 60.0) + (s / 3600.0)) / 24.0
    JD = math.floor(365.25 * (Y + 4716)) + math.floor(30.6001 * (M + 1)) + D + B - 1524.5 + day_fraction
    d = JD - 2451545.0
    return JD, d


def calculate_solar_position(latitude: float, longitude: float, dt_utc: datetime) -> SolarPosition:
    """Calculate solar altitude, azimuth, zenith, and equation of time using NOAA equations."""
    _, d = _julian_day_and_epoch(dt_utc)

    # Mean anomaly of Sun (degrees -> radians)
    M_sun_deg = (357.5291 + 0.98560028 * d) % 360.0
    M_sun = math.radians(M_sun_deg)

    # Sun equation of center (degrees)
    C_deg = 1.9148 * math.sin(M_sun) + 0.0200 * math.sin(2 * M_sun) + 0.0003 * math.sin(3 * M_sun)

    # Sun true/apparent ecliptic longitude (degrees -> radians)
    Pi_deg = 102.9372
    lambda_sun_deg = (M_sun_deg + C_deg + Pi_deg + 180.0) % 360.0
    lambda_sun = math.radians(lambda_sun_deg)

    # Obliquity of ecliptic (degrees -> radians)
    epsilon_deg = 23.4393 - 0.0000004 * d
    epsilon = math.radians(epsilon_deg)

    # Declination & Right Ascension
    sin_delta = math.sin(epsilon) * math.sin(lambda_sun)
    delta = math.asin(max(-1.0, min(1.0, sin_delta)))
    alpha = math.atan2(math.cos(epsilon) * math.sin(lambda_sun), math.cos(lambda_sun))

    # Sidereal time and Hour angle
    theta_0_deg = (280.1600 + 360.9856235 * d) % 360.0
    theta = math.radians(theta_0_deg) + math.radians(longitude)
    H = theta - alpha

    # Solar Altitude
    phi = math.radians(latitude)
    sin_alt = math.sin(phi) * math.sin(delta) + math.cos(phi) * math.cos(delta) * math.cos(H)
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt_rad = math.asin(sin_alt)
    alt_deg = math.degrees(alt_rad)

    # Solar Azimuth (measured clockwise from North)
    y = -math.sin(H) * math.cos(delta)
    x = math.sin(delta) * math.cos(phi) - math.cos(delta) * math.sin(phi) * math.cos(H)
    az_deg = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0

    # Zenith & Shadow
    zenith_deg = max(0.0, 90.0 - alt_deg)
    shadow_az_deg = (az_deg + 180.0) % 360.0

    shadow_ratio: Optional[float] = None
    if alt_deg > 0.5:
        shadow_ratio = round(1.0 / math.tan(alt_rad), 3)

    # Equation of Time (minutes)
    y_tan = math.tan(epsilon / 2.0) ** 2
    L0_rad = math.radians((280.46646 + 0.9856474 * d) % 360.0)
    e = 0.016708634 - 0.000000042037 * d
    eq_time_rad = (
        y_tan * math.sin(2 * L0_rad)
        - 2 * e * math.sin(M_sun)
        + 4 * e * y_tan * math.sin(M_sun) * math.cos(2 * L0_rad)
        - 0.5 * (y_tan**2) * math.sin(4 * L0_rad)
        - 1.25 * (e**2) * math.sin(2 * M_sun)
    )
    eq_time_min = 4.0 * math.degrees(eq_time_rad)

    return SolarPosition(
        altitude=round(alt_deg, 2),
        azimuth=round(az_deg, 2),
        zenith=round(zenith_deg, 2),
        shadow_azimuth=round(shadow_az_deg, 2),
        shadow_length_ratio=shadow_ratio,
        is_daylight=alt_deg > 0.0,
        declination=round(math.degrees(delta), 2),
        equation_of_time_minutes=round(eq_time_min, 2),
    )


def _calculate_solar_events(latitude: float, longitude: float, target_date: date) -> SolarEvents:
    """Calculate sunrise, solar noon, and sunset in UTC."""
    noon_utc = datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0, tzinfo=timezone.utc)
    _, d = _julian_day_and_epoch(noon_utc)

    # Declination & Equation of Time at noon
    M_sun_deg = (357.5291 + 0.98560028 * d) % 360.0
    M_sun = math.radians(M_sun_deg)
    C_deg = 1.9148 * math.sin(M_sun) + 0.0200 * math.sin(2 * M_sun) + 0.0003 * math.sin(3 * M_sun)
    lambda_sun_deg = (M_sun_deg + C_deg + 102.9372 + 180.0) % 360.0
    lambda_sun = math.radians(lambda_sun_deg)

    epsilon_deg = 23.4393 - 0.0000004 * d
    epsilon = math.radians(epsilon_deg)

    sin_delta = math.sin(epsilon) * math.sin(lambda_sun)
    delta = math.asin(max(-1.0, min(1.0, sin_delta)))

    # Eq Time
    y_tan = math.tan(epsilon / 2.0) ** 2
    L0_rad = math.radians((280.46646 + 0.9856474 * d) % 360.0)
    e = 0.016708634 - 0.000000042037 * d
    eq_time_rad = (
        y_tan * math.sin(2 * L0_rad)
        - 2 * e * math.sin(M_sun)
        + 4 * e * y_tan * math.sin(M_sun) * math.cos(2 * L0_rad)
        - 0.5 * (y_tan**2) * math.sin(4 * L0_rad)
        - 1.25 * (e**2) * math.sin(2 * M_sun)
    )
    eq_time_min = 4.0 * math.degrees(eq_time_rad)

    solar_noon_min = (720.0 - 4.0 * longitude - eq_time_min) % 1440.0
    noon_h = int(solar_noon_min // 60)
    noon_m = int(solar_noon_min % 60)
    solar_noon_str = f"{noon_h:02d}:{noon_m:02d} UTC"

    phi = math.radians(latitude)
    cos_H0 = (math.cos(math.radians(90.8333)) - math.sin(phi) * math.sin(delta)) / (math.cos(phi) * math.cos(delta))

    sunrise_str: Optional[str] = None
    sunset_str: Optional[str] = None
    daylight_hours: Optional[float] = None

    if cos_H0 > 1.0:
        # Polar night
        sunrise_str = "None (Polar Night)"
        sunset_str = "None (Polar Night)"
        daylight_hours = 0.0
    elif cos_H0 < -1.0:
        # Midnight sun
        sunrise_str = "None (Midnight Sun)"
        sunset_str = "None (Midnight Sun)"
        daylight_hours = 24.0
    else:
        H0_deg = math.degrees(math.acos(cos_H0))
        daylight_hours = round(2.0 * H0_deg / 15.0, 2)
        sunrise_min = (solar_noon_min - H0_deg * 4.0) % 1440.0
        sunset_min = (solar_noon_min + H0_deg * 4.0) % 1440.0

        sunrise_str = f"{int(sunrise_min // 60):02d}:{int(sunrise_min % 60):02d} UTC"
        sunset_str = f"{int(sunset_min // 60):02d}:{int(sunset_min % 60):02d} UTC"

    # Max altitude at solar noon
    noon_pos = calculate_solar_position(
        latitude,
        longitude,
        datetime(target_date.year, target_date.month, target_date.day, noon_h, noon_m, 0, tzinfo=timezone.utc),
    )

    return SolarEvents(
        sunrise=sunrise_str,
        solar_noon=solar_noon_str,
        sunset=sunset_str,
        max_altitude_deg=noon_pos.altitude,
        daylight_duration_hours=daylight_hours,
    )


def estimate_chronolocation(
    latitude: float,
    longitude: float,
    target_date: date,
    shadow_azimuth: float,
    shadow_length_ratio: Optional[float] = None,
    timezone_offset: Optional[float] = None,
) -> ChronolocationEstimate:
    """Estimate time of capture by matching shadow azimuth antipodally against NOAA solar angles."""
    target_sun_az = (shadow_azimuth + 180.0) % 360.0

    if timezone_offset is None:
        timezone_offset = round(longitude / 15.0)

    best_min = 720
    best_error = 999.0
    best_alt = 0.0

    # Scan 1440 minutes of the target day
    for minute_idx in range(0, 1440):
        h = minute_idx // 60
        m = minute_idx % 60
        dt = datetime(target_date.year, target_date.month, target_date.day, h, m, 0, tzinfo=timezone.utc)
        pos = calculate_solar_position(latitude, longitude, dt)

        if pos.altitude > 0.0:  # Daylight only
            az_diff = abs(pos.azimuth - target_sun_az)
            az_diff = min(az_diff, 360.0 - az_diff)

            score = az_diff
            if shadow_length_ratio and shadow_length_ratio > 0.0:
                expected_alt = math.degrees(math.atan(1.0 / shadow_length_ratio))
                alt_diff = abs(pos.altitude - expected_alt)
                score = az_diff + 1.5 * alt_diff

            if score < best_error:
                best_error = score
                best_min = minute_idx
                best_alt = pos.altitude

    # Compute UTC & Local time strings
    utc_h = best_min // 60
    utc_m = best_min % 60
    utc_str = f"{utc_h:02d}:{utc_m:02d}"

    local_total_min = int((best_min + timezone_offset * 60.0) % 1440)
    loc_h = local_total_min // 60
    loc_m = local_total_min % 60
    loc_str = f"{loc_h:02d}:{loc_m:02d}"

    # Categorize time of day period
    if best_alt <= 0.0:
        period = "Ban đêm (Night)"
        category = "Night"
    elif loc_h < 8 or (best_alt < 15.0 and loc_h < 12):
        period = "Sáng sớm (Early Morning / Golden Hour)"
        category = "Early Morning"
    elif loc_h < 11:
        period = "Buổi sáng (Morning)"
        category = "Morning"
    elif 11 <= loc_h <= 13 or best_alt > 65.0:
        period = "Trưa (Solar Noon / Midday)"
        category = "Trưa (Solar Noon)"
    elif loc_h < 16:
        period = "Buổi chiều (Afternoon)"
        category = "Afternoon"
    else:
        period = "Chiều muộn / Hoàng hôn (Golden Hour / Sunset)"
        category = "Sunset / Golden Hour"

    confidence = "high" if best_error < 5.0 else ("medium" if best_error < 15.0 else "low")

    return ChronolocationEstimate(
        target_shadow_azimuth=round(shadow_azimuth, 2),
        target_sun_azimuth=round(target_sun_az, 2),
        estimated_local_time=loc_str,
        estimated_utc_time=utc_str,
        time_of_day_period=period,
        time_of_day_category=category,
        angular_error_degrees=round(best_error, 2),
        confidence=confidence,
        solar_altitude_deg=round(best_alt, 2),
    )


def get_suncalc_data(
    latitude: float,
    longitude: float,
    date_str: Optional[str] = None,
    time_str: Optional[str] = None,
    timestamp: Optional[float] = None,
    shadow_azimuth: Optional[float] = None,
    shadow_length_ratio: Optional[float] = None,
    timezone_offset: Optional[float] = None,
) -> SunCalcResponse:
    """Calculate complete solar celestial telemetry, 24h trajectory, and chronolocation."""
    # Determine target datetime in UTC
    if timestamp is not None:
        target_dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        target_date = target_dt.date()
    else:
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date format. Expected YYYY-MM-DD")
        else:
            target_date = datetime.now(timezone.utc).date()

        if time_str and time_str.strip():
            clean_time = time_str.strip()
            parsed_time = None
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    parsed_time = datetime.strptime(clean_time, fmt).time()
                    break
                except ValueError:
                    pass
            if parsed_time is None:
                raise ValueError("Invalid time format. Expected HH:MM or HH:MM:SS")
            target_dt = datetime.combine(target_date, parsed_time, tzinfo=timezone.utc)
        elif date_str:
            target_dt = datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0, tzinfo=timezone.utc)
        else:
            target_dt = datetime.now(timezone.utc)

    date_formatted = target_date.strftime("%Y-%m-%d")

    # Current/Instantaneous solar position
    pos = calculate_solar_position(latitude, longitude, target_dt)

    # 24-hour solar path sampled every 30 minutes
    solar_path: List[Dict[str, Any]] = []
    for h in range(24):
        for m in (0, 30):
            sample_dt = datetime(target_date.year, target_date.month, target_date.day, h, m, 0, tzinfo=timezone.utc)
            sample_pos = calculate_solar_position(latitude, longitude, sample_dt)
            solar_path.append(
                {
                    "time_utc": f"{h:02d}:{m:02d}",
                    "altitude": sample_pos.altitude,
                    "azimuth": sample_pos.azimuth,
                    "shadow_azimuth": sample_pos.shadow_azimuth,
                    "is_daylight": sample_pos.is_daylight,
                }
            )

    # Solar events (sunrise, noon, sunset)
    events = _calculate_solar_events(latitude, longitude, target_date)

    # Chronolocation estimate (if shadow azimuth provided)
    chrono_est: Optional[ChronolocationEstimate] = None
    if shadow_azimuth is not None:
        chrono_est = estimate_chronolocation(
            latitude=latitude,
            longitude=longitude,
            target_date=target_date,
            shadow_azimuth=shadow_azimuth,
            shadow_length_ratio=shadow_length_ratio,
            timezone_offset=timezone_offset,
        )

    # Determine default display fields for response
    if chrono_est:
        est_local = chrono_est.estimated_local_time
        est_utc = chrono_est.estimated_utc_time
        time_cat = chrono_est.time_of_day_period
        display_alt = chrono_est.solar_altitude_deg
        display_az = chrono_est.target_sun_azimuth
    else:
        est_local = target_dt.strftime("%H:%M")
        est_utc = target_dt.strftime("%H:%M")
        time_cat = "Solar Noon" if pos.altitude > 60.0 else ("Daylight" if pos.is_daylight else "Night")
        display_alt = pos.altitude
        display_az = pos.azimuth

    return SunCalcResponse(
        status="success",
        latitude=latitude,
        longitude=longitude,
        date=date_formatted,
        sun_azimuth_deg=display_az,
        solar_altitude_deg=display_alt,
        estimated_time_local=est_local,
        estimated_time_utc=est_utc,
        time_of_day_category=time_cat,
        solar_position=pos,
        chronolocation=chrono_est,
        solar_events=events,
        solar_path_24h=solar_path,
        solar_curve=solar_path,
    )
