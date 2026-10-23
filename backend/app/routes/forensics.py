"""FastAPI Router for Photo Forensics Studio: Metadata extraction, ELA, and NOAA SunCalc."""

import base64
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.models.forensics import (
    AnalyzeRequestJson,
    ELARequestJson,
    ELAResponse,
    ForensicsAnalyzeResponse,
    SunCalcRequest,
    SunCalcResponse,
)
from app.services import forensics_service

router = APIRouter(prefix="/api/forensics", tags=["Photo Forensics"])


def _decode_base64_payload(b64_str: str) -> bytes:
    """Safely decode base64 string, stripping data URL prefix if present."""
    if not b64_str or not isinstance(b64_str, str):
        raise ValueError("Invalid or empty base64 string")

    clean_str = b64_str.strip()
    if "," in clean_str and "base64" in clean_str[:50]:
        clean_str = clean_str.split(",", 1)[1]

    try:
        return base64.b64decode(clean_str)
    except Exception as e:
        raise ValueError(f"Base64 decoding failed: {str(e)}")


@router.post("/analyze", response_model=ForensicsAnalyzeResponse)
async def analyze_photo(request: Request) -> ForensicsAnalyzeResponse:
    """Analyze image metadata, EXIF, GPS decimal coordinates, IPTC, XMP, and filename fingerprints.

    Supports both multipart file uploads and application/json base64 payloads.
    """
    content_type = request.headers.get("content-type", "").lower()
    image_bytes: Optional[bytes] = None
    filename: str = "image.jpg"

    if "application/json" in content_type:
        try:
            body = await request.json()
            req = AnalyzeRequestJson(**body)
            image_bytes = _decode_base64_payload(req.image_base64)
            if req.filename:
                filename = req.filename
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON request: {str(e)}")
    elif "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if not file or not hasattr(file, "read"):
                raise HTTPException(status_code=400, detail="Missing required image file in multipart upload")
            filename = getattr(file, "filename", "image.jpg") or "image.jpg"
            image_bytes = await file.read()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading multipart upload: {str(e)}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported content-type. Use multipart/form-data or application/json",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image data provided")

    try:
        response = forensics_service.extract_metadata(image_bytes=image_bytes, filename=filename)
        return response
    except (ValueError, OSError) as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensics analysis failed: {str(e)}")


@router.post("/ela", response_model=ELAResponse)
async def compute_ela(request: Request) -> ELAResponse:
    """Compute Error Level Analysis (ELA) and return difference image, JET heatmap, and statistics.

    Supports both multipart form-data and application/json base64 payloads.
    """
    content_type = request.headers.get("content-type", "").lower()
    image_bytes: Optional[bytes] = None
    filename: str = "image.jpg"
    quality: int = 90
    scale: float = 15.0
    colormap: str = "jet"

    if "application/json" in content_type:
        try:
            body = await request.json()
            req = ELARequestJson(**body)
            image_bytes = _decode_base64_payload(req.image_base64)
            if req.filename:
                filename = req.filename
            quality = req.quality
            scale = req.scale
            colormap = req.colormap or "jet"
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON request: {str(e)}")
    elif "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if not file or not hasattr(file, "read"):
                raise HTTPException(status_code=400, detail="Missing required image file in multipart upload")
            filename = getattr(file, "filename", "image.jpg") or "image.jpg"
            image_bytes = await file.read()

            raw_quality = form.get("quality")
            if raw_quality is not None:
                try:
                    quality = int(raw_quality)
                except ValueError:
                    quality = 90

            raw_scale = form.get("scale")
            if raw_scale is not None:
                try:
                    scale = float(raw_scale)
                except ValueError:
                    scale = 15.0

            raw_colormap = form.get("colormap")
            if raw_colormap is not None:
                colormap = str(raw_colormap)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading multipart upload: {str(e)}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported content-type. Use multipart/form-data or application/json",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image data provided")

    try:
        response = forensics_service.compute_error_level_analysis(
            image_bytes=image_bytes,
            filename=filename,
            quality=quality,
            scale=scale,
            colormap=colormap,
        )
        return response
    except (ValueError, OSError) as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ELA computation failed: {str(e)}")


@router.post("/suncalc", response_model=SunCalcResponse)
async def calculate_sun(req: SunCalcRequest) -> SunCalcResponse:
    """Calculate NOAA Solar position, 24h trajectory, and estimate reverse chronolocation from shadow angle."""
    shadow_az = req.shadow_azimuth
    if shadow_az is None and req.shadow_angle is not None:
        shadow_az = req.shadow_angle

    shadow_ratio = req.shadow_length_ratio
    if shadow_ratio is None and req.shadow_ratio is not None:
        shadow_ratio = req.shadow_ratio

    try:
        response = forensics_service.get_suncalc_data(
            latitude=req.latitude,
            longitude=req.longitude,
            date_str=req.date,
            time_str=req.time,
            timestamp=req.timestamp,
            shadow_azimuth=shadow_az,
            shadow_length_ratio=shadow_ratio,
            timezone_offset=req.timezone_offset,
        )
        return response
    except (ValueError, IndexError) as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SunCalc computation failed: {str(e)}")
