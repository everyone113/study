from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator


class FileInfo(BaseModel):
    size_bytes: int
    width: int
    height: int
    format: str
    mode: str
    md5: str
    sha256: str


class CameraInfo(BaseModel):
    has_exif: bool = False
    make: Optional[str] = None
    model: Optional[str] = None
    lens_make: Optional[str] = None
    lens_model: Optional[str] = None
    software: Optional[str] = None
    datetime_original: Optional[str] = None
    datetime_digitized: Optional[str] = None
    datetime_modified: Optional[str] = None
    timezone_offset: Optional[str] = None
    iso_original: Optional[str] = None
    exposure_time: Optional[str] = None
    f_number: Optional[Union[float, str]] = None
    iso: Optional[int] = None
    focal_length: Optional[Union[float, str]] = None
    focal_length_35mm: Optional[Union[float, str]] = None
    flash: Optional[Union[int, str]] = None
    white_balance: Optional[Union[int, str]] = None
    metering_mode: Optional[Union[int, str]] = None
    orientation: Optional[int] = None
    orientation_desc: Optional[str] = None


class GPSInfo(BaseModel):
    has_gps: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    latitude_ref: Optional[str] = None
    longitude_ref: Optional[str] = None
    altitude_ref: Optional[Union[int, str]] = None
    timestamp_utc: Optional[str] = None
    google_maps_url: Optional[str] = None
    osm_url: Optional[str] = None


class FilenameFingerprint(BaseModel):
    matched: bool = False
    platform: str = "Unknown"
    pattern_name: Optional[str] = None
    photo_id: Optional[str] = None
    user_id: Optional[str] = None
    unix_timestamp: Optional[int] = None
    detected_timestamp: Optional[int] = None
    iso_datetime: Optional[str] = None
    extracted_datetime: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    osint_links: List[str] = Field(default_factory=list)
    confidence: str = "none"  # "high", "medium", "low", "none"
    description: Optional[str] = None


class TamperingIndicators(BaseModel):
    software_detected: bool = False
    software_name: Optional[str] = None
    exif_scrubbed: bool = False
    score: float = 0.0
    warnings: List[str] = Field(default_factory=list)


class ForensicsAnalyzeResponse(BaseModel):
    status: str = "success"
    filename: str
    file_info: FileInfo
    exif: CameraInfo
    gps: GPSInfo
    iptc: Dict[str, Any] = Field(default_factory=dict)
    xmp: Dict[str, Any] = Field(default_factory=dict)
    fingerprint: FilenameFingerprint
    software_tampering_score: float = 0.0
    tampering_indicators: Optional[TamperingIndicators] = None
    camera: Optional[CameraInfo] = None
    dimensions: Optional[Dict[str, int]] = None
    raw_exif: Dict[str, Any] = Field(default_factory=dict)


class AnalyzeRequestJson(BaseModel):
    image_base64: str
    filename: Optional[str] = "image.jpg"


class ELAStatistics(BaseModel):
    mean_difference: float
    max_difference: float
    min_difference: float = 0.0
    std_difference: float = 0.0
    manipulation_risk: str  # "low", "medium", "high"
    anomaly_score: float = 0.0
    tampering_detected: bool = False
    tampering_confidence: str = "low"
    tampering_description: str = ""


class ELAResponse(BaseModel):
    status: str = "success"
    original_filename: Optional[str] = None
    quality: int = 90
    scale: float = 15.0
    quality_used: Optional[int] = None
    scale_used: Optional[float] = None
    colormap: str = "jet"
    dimensions: Optional[Dict[str, int]] = None
    ela_image_base64: str
    heatmap_base64: str
    ela_data_url: Optional[str] = None
    heatmap_data_url: Optional[str] = None
    statistics: ELAStatistics
    stats: Optional[ELAStatistics] = None
    metrics: Optional[Dict[str, float]] = None
    is_lossless_source: bool = False
    source_format: str = "JPEG"
    elapsed_seconds: float = 0.0


class ELARequestJson(BaseModel):
    image_base64: str
    filename: Optional[str] = "image.jpg"
    quality: int = Field(default=90, ge=10, le=100)
    scale: float = Field(default=15.0, ge=1.0, le=50.0)
    colormap: str = "jet"


class SunCalcRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    date: Optional[str] = None
    time: Optional[str] = None
    timestamp: Optional[float] = None
    shadow_azimuth: Optional[float] = Field(default=None, ge=0.0, le=360.0)
    shadow_angle: Optional[float] = None
    shadow_ratio: Optional[float] = None
    shadow_length_ratio: Optional[float] = None
    timezone_offset: Optional[float] = None

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Invalid date format. Expected YYYY-MM-DD")
        return v

    @field_validator("time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_clean = v.strip()
        if not v_clean:
            return None
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                datetime.strptime(v_clean, fmt)
                return v_clean
            except ValueError:
                continue
        raise ValueError("Invalid time format. Expected HH:MM or HH:MM:SS")


class SolarPosition(BaseModel):
    altitude: float
    azimuth: float
    zenith: float
    shadow_azimuth: float
    shadow_length_ratio: Optional[float] = None
    is_daylight: bool
    declination: float
    equation_of_time_minutes: float


class ChronolocationEstimate(BaseModel):
    target_shadow_azimuth: float
    target_sun_azimuth: float
    estimated_local_time: str
    estimated_utc_time: str
    time_of_day_period: str
    time_of_day_category: str
    angular_error_degrees: float
    confidence: str
    solar_altitude_deg: float


class SolarEvents(BaseModel):
    sunrise: Optional[str] = None
    solar_noon: Optional[str] = None
    sunset: Optional[str] = None
    max_altitude_deg: Optional[float] = None
    daylight_duration_hours: Optional[float] = None


class SunCalcResponse(BaseModel):
    status: str = "success"
    latitude: float
    longitude: float
    date: str
    sun_azimuth_deg: float
    solar_altitude_deg: float
    estimated_time_local: Optional[str] = None
    estimated_time_utc: Optional[str] = None
    time_of_day_category: Optional[str] = None
    solar_position: Optional[SolarPosition] = None
    chronolocation: Optional[ChronolocationEstimate] = None
    solar_events: Optional[SolarEvents] = None
    solar_path_24h: List[Dict[str, Any]] = Field(default_factory=list)
    solar_curve: Optional[List[Dict[str, Any]]] = None
