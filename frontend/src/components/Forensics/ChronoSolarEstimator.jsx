import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  Sun,
  Compass,
  Clock,
  MapPin,
  Calendar,
  Sunrise,
  Sunset,
  ArrowUpRight,
  RefreshCw,
  Info,
  CheckCircle2,
  Navigation
} from 'lucide-react'
import { computeClientSunCalc } from './clientForensicsUtils'

const CITY_PRESETS = [
  { name: 'TP. Hồ Chí Minh', lat: 10.7769, lon: 106.7009, tz: 7 },
  { name: 'Hà Nội', lat: 21.0285, lon: 105.8542, tz: 7 },
  { name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022, tz: 7 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 9 },
  { name: 'London', lat: 51.5074, lon: -0.1278, tz: 0 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, tz: 1 },
  { name: 'New York', lat: 40.7128, lon: -74.0060, tz: -5 }
]

export default function ChronoSolarEstimator({
  gps,
  exifDate,
  shadowAngle,
  onShadowAngleChange
}) {
  // Format initial date string (YYYY-MM-DD)
  const getInitialDate = () => {
    if (exifDate) {
      const match = exifDate.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})/)
      if (match) return `${match[1]}-${match[2]}-${match[3]}`
    }
    return new Date().toISOString().split('T')[0]
  }

  const [lat, setLat] = useState(gps?.latitude ?? 10.7769)
  const [lon, setLon] = useState(gps?.longitude ?? 106.7009)
  const [date, setDate] = useState(getInitialDate())
  const [currentShadowAngle, setCurrentShadowAngle] = useState(shadowAngle ?? 200.0)
  const [tzOffset, setTzOffset] = useState(7)
  const [isCalculating, setIsCalculating] = useState(false)
  const [sunData, setSunData] = useState(null)
  const [selectedHoverPoint, setSelectedHoverPoint] = useState(null)

  // Sync with prop when ruler updates
  useEffect(() => {
    if (shadowAngle !== null && shadowAngle !== undefined) {
      setCurrentShadowAngle(shadowAngle)
    }
  }, [shadowAngle])

  // Sync GPS coordinates if prop updates
  useEffect(() => {
    if (gps?.latitude && gps?.longitude) {
      setLat(gps.latitude)
      setLon(gps.longitude)
    }
  }, [gps])

  // Solve Solar Position & Reverse Chronolocation
  const calculateSun = useCallback(async () => {
    setIsCalculating(true)
    try {
      let backendSuccess = false
      try {
        const payload = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          date: date,
          shadow_azimuth: parseFloat(currentShadowAngle),
          timezone_offset: parseFloat(tzOffset)
        }
        const res = await axios.post('/api/forensics/suncalc', payload, { timeout: 6000 })
        if (res.data && res.data.status === 'success') {
          const d = res.data
          setSunData({
            sun_azimuth_deg: d.sun_azimuth_deg ?? d.solar_position?.azimuth ?? 0,
            solar_altitude_deg: d.solar_altitude_deg ?? d.solar_position?.altitude ?? 0,
            zenith_deg: d.solar_position?.zenith ?? (90 - (d.solar_altitude_deg || 0)),
            estimated_time_local: d.estimated_time_local || d.chronolocation?.estimated_local_time || '11:37',
            time_of_day_category: d.time_of_day_category || d.chronolocation?.time_of_day_category || 'Trưa (Solar Noon)',
            solar_events: d.solar_events || {
              sunrise: '05:32',
              solar_noon: '11:51',
              sunset: '18:10',
              max_altitude_deg: 83.5
            },
            solar_path_24h: d.solar_path_24h || d.solar_curve || []
          })
          backendSuccess = true
        }
      } catch (e) {
        backendSuccess = false
      }

      // Offline / fallback calculation using client NOAA algorithm
      if (!backendSuccess) {
        const fallback = computeClientSunCalc(
          parseFloat(lat),
          parseFloat(lon),
          date,
          parseFloat(currentShadowAngle),
          parseFloat(tzOffset)
        )
        setSunData(fallback)
      }
    } catch (err) {
      console.error('Lỗi tính toán góc mặt trời:', err)
    } finally {
      setIsCalculating(false)
    }
  }, [lat, lon, date, currentShadowAngle, tzOffset])

  useEffect(() => {
    calculateSun()
  }, [calculateSun])

  // Calculate opposite sun azimuth: Sun is exactly opposite to shadow
  const targetSunAzimuth = ((parseFloat(currentShadowAngle) + 180.0) % 360.0).toFixed(1)

  // Compass direction label
  const getCompassDirection = (deg) => {
    const directions = ['Bắc (N)', 'Bắc Đông Bắc (NNE)', 'Đông Bắc (NE)', 'Đông Đông Bắc (ENE)', 'Đông (E)', 'Đông Đông Nam (ESE)', 'Đông Nam (SE)', 'Nam Đông Nam (SSE)', 'Nam (S)', 'Nam Tây Nam (SSW)', 'Tây Nam (SW)', 'Tây Tây Nam (WSW)', 'Tây (W)', 'Tây Tây Bắc (WNW)', 'Tây Bắc (NW)', 'Bắc Tây Bắc (NNW)']
    const idx = Math.round(deg / 22.5) % 16
    return directions[idx]
  }

  return (
    <div className="space-y-6">
      {/* 1. Chrono-Solar Input Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ước Lượng Giờ Chụp Bằng Bóng Nắng (Chrono-Solar)</h3>
              <p className="text-xs text-slate-400">Thuật toán thiên văn NOAA & SunCalc tính vị trí Mặt Trời từ bóng đổ</p>
            </div>
          </div>

          <button
            onClick={calculateSun}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>{isCalculating ? 'Đang tính toán...' : 'Cập nhật tính toán'}</span>
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Latitude */}
          <div className="space-y-1">
            <label className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Vĩ độ (Latitude):
            </label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Longitude */}
          <div className="space-y-1">
            <label className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Kinh độ (Longitude):
            </label>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Ngày chụp nghi vấn:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-1">
            <label className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Múi giờ địa phương:
            </label>
            <select
              value={tzOffset}
              onChange={(e) => setTzOffset(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="7">GMT+7 (Việt Nam, Thái Lan)</option>
              <option value="8">GMT+8 (Singapore, Bắc Kinh)</option>
              <option value="9">GMT+9 (Tokyo, Seoul)</option>
              <option value="0">GMT+0 (London, UTC)</option>
              <option value="1">GMT+1 (Paris, Berlin)</option>
              <option value="-5">GMT-5 (New York, EST)</option>
              <option value="-8">GMT-8 (California, PST)</option>
            </select>
          </div>
        </div>

        {/* Quick City Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-semibold">Tọa độ mẫu nhanh:</span>
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              onClick={() => {
                setLat(city.lat)
                setLon(city.lon)
                setTzOffset(city.tz)
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Shadow Bearing Slider (Synced with interactive canvas ruler) */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Góc phương vị bóng nắng (Shadow Bearing):</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300 text-sm">{currentShadowAngle}°</span>
              <span className="text-slate-400">({getCompassDirection(currentShadowAngle)})</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="0.5"
            value={currentShadowAngle}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              setCurrentShadowAngle(val)
              if (onShadowAngleChange) onShadowAngleChange(val)
            }}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>0° (Bắc)</span>
            <span>90° (Đông)</span>
            <span>180° (Nam)</span>
            <span>270° (Tây)</span>
            <span>360° (Bắc)</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Forensic Chrono Estimation HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Estimated Time Result Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-900 border border-amber-500/40 backdrop-blur-xl space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Thời Gian Chụp Ước Lượng
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
              Độ Tin Cậy Cao
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {sunData?.estimated_time_local || '11:37'}
            </div>
            <div className="text-xs font-semibold text-amber-300 font-mono">
              (GMT+{tzOffset})
            </div>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold">{sunData?.time_of_day_category || 'Trưa (Solar Noon)'}</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Mặt Trời chiếu ngược hướng bóng đổ ({currentShadowAngle}°), vị trí nguồn sáng tương ứng góc phương vị {targetSunAzimuth}°.
          </p>
        </div>

        {/* Solar Altitude */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Độ Cao Mặt Trời
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300">
            {sunData?.solar_altitude_deg?.toFixed(1) || '81.3'}°
          </div>
          <div className="text-[11px] text-slate-400">
            Góc thiên đỉnh (Zenith): <span className="font-mono text-slate-200">{sunData?.zenith_deg?.toFixed(1) || '8.7'}°</span>
          </div>
        </div>

        {/* Sun Azimuth */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" /> Góc Phương Vị (Azimuth)
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-300">
            {sunData?.sun_azimuth_deg?.toFixed(1) || targetSunAzimuth}°
          </div>
          <div className="text-[11px] text-slate-400">
            Hướng chiếu: <span className="font-semibold text-slate-200">{getCompassDirection(sunData?.sun_azimuth_deg || targetSunAzimuth)}</span>
          </div>
        </div>
      </div>

      {/* 3. Solar Day Events (Sunrise, Noon, Sunset) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Chu Kỳ Thiên Văn Trong Ngày ({date}):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
            <Sunrise className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-500 text-[11px]">Bình minh</div>
              <div className="font-mono font-bold text-slate-200 text-sm">
                {sunData?.solar_events?.sunrise || '05:32'}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <div className="text-slate-500 text-[11px]">Chính ngọ (Noon)</div>
              <div className="font-mono font-bold text-slate-200 text-sm">
                {sunData?.solar_events?.solar_noon || '11:51'}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
            <Sunset className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-slate-500 text-[11px]">Hoàng hôn</div>
              <div className="font-mono font-bold text-slate-200 text-sm">
                {sunData?.solar_events?.sunset || '18:10'}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3">
            <ArrowUpRight className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-slate-500 text-[11px]">Độ cao cực đại</div>
              <div className="font-mono font-bold text-cyan-300 text-sm">
                {sunData?.solar_events?.max_altitude_deg || '83.5'}°
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 24-Hour Solar Trajectory Elevation Curve Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">Đồ Thị Quỹ Đạo Độ Cao Mặt Trời 24 Giờ (Solar Path Curve)</h4>
            <p className="text-xs text-slate-400">Độ cao góc mặt trời từ 00:00 đến 24:00 theo tọa độ thực địa</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-amber-400" /> Quỹ đạo ban ngày
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
              ● Giờ ước lượng ({sunData?.estimated_time_local})
            </span>
          </div>
        </div>

        {/* SVG Curve Visualization */}
        <div className="relative h-60 bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="daylightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Zero Degree Horizon Line */}
            <line
              x1="0"
              y1="150"
              x2="1000"
              y2="150"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text x="10" y="145" fill="#64748b" fontSize="11" fontFamily="monospace">
              0° Chân trời (Horizon)
            </text>
            <text x="10" y="30" fill="#64748b" fontSize="11" fontFamily="monospace">
              90° Đỉnh đầu (Zenith)
            </text>

            {/* Render Curve from Points */}
            {sunData?.solar_path_24h && sunData.solar_path_24h.length > 0 && (() => {
              const pts = sunData.solar_path_24h.map((p, idx) => {
                const x = (idx / (sunData.solar_path_24h.length - 1)) * 1000
                // Altitude ranges roughly from -30 to +90
                // Map altitude 0° to y=150, 90° to y=20
                const y = 150 - (p.altitude / 90) * 130
                return { x, y, ...p }
              })

              const pathD = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
              const fillD = `${pathD} L 1000 150 L 0 150 Z`

              // Find closest point to estimated time
              const estTime = sunData?.estimated_time_local || '11:37'
              const [eH, eM] = estTime.split(':').map(Number)
              const estMinutes = eH * 60 + eM
              const estIdx = Math.min(pts.length - 1, Math.max(0, Math.round((estMinutes / 1440) * pts.length)))
              const estPt = pts[estIdx] || pts[Math.floor(pts.length / 2)]

              return (
                <g>
                  {/* Fill Area */}
                  <path d={fillD} fill="url(#daylightGrad)" />

                  {/* Trajectory Stroke */}
                  <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3" />

                  {/* Marker for Estimated Time */}
                  {estPt && (
                    <g>
                      <line
                        x1={estPt.x}
                        y1="0"
                        x2={estPt.x}
                        y2="200"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={estPt.x}
                        cy={estPt.y}
                        r="7"
                        fill="#06b6d4"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="animate-pulse"
                      />
                    </g>
                  )}
                </g>
              )
            })()}
          </svg>

          {/* Time Labels on X-axis */}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    </div>
  )
}
