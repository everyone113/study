import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Sliders,
  Sun,
  Contrast,
  Sparkles,
  Compass,
  Eye,
  Crosshair,
  Check,
  X
} from 'lucide-react'

export default function InspectionViewer({
  imageDataUrl,
  imageDimensions,
  shadowAngle,
  onShadowAngleChange,
  onPixelInspect
}) {
  // Viewport transformation
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Optical Loupe
  const [isLoupeActive, setIsLoupeActive] = useState(false)
  const [loupeZoom, setLoupeZoom] = useState(4) // 2x, 4x, 8x
  const [loupePos, setLoupePos] = useState({ clientX: 0, clientY: 0, imgX: 0, imgY: 0 })
  const [pixelColor, setPixelColor] = useState({ r: 0, g: 0, b: 0, hex: '#000000' })

  // Visual Filters
  const [brightness, setBrightness] = useState(0) // -100 to 100
  const [contrastVal, setContrastVal] = useState(0) // -100 to 100
  const [invert, setInvert] = useState(false)
  const [sharpen, setSharpen] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false)

  // Shadow Ruler
  const [isRulerActive, setIsRulerActive] = useState(false)
  const [rulerPoints, setRulerPoints] = useState(null) // { baseX, baseY, tipX, tipY }
  const [isDrawingRuler, setIsDrawingRuler] = useState(false)

  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const offscreenCanvasRef = useRef(null)
  const loupeCanvasRef = useRef(null)

  // Initialize offscreen canvas for pixel inspection
  useEffect(() => {
    if (!imageDataUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      offscreenCanvasRef.current = canvas
    }
    img.src = imageDataUrl
  }, [imageDataUrl])

  // Reset view to fit container
  const handleResetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 10))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.2))
  const handle100Percent = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'm' || e.key === 'M') {
        setIsLoupeActive(prev => !prev)
        if (!isLoupeActive) setIsRulerActive(false)
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRulerActive(prev => !prev)
        if (!isRulerActive) setIsLoupeActive(false)
      } else if (e.key === '0' || e.key === 'Escape') {
        handleResetView()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoupeActive, isRulerActive, handleResetView])

  // Convert mouse screen coordinates to natural image coordinates
  const getImageCoordinates = useCallback((clientX, clientY) => {
    if (!imageRef.current) return { x: 0, y: 0 }
    const rect = imageRef.current.getBoundingClientRect()
    const scaleX = (imageDimensions?.width || imageRef.current.naturalWidth || rect.width) / rect.width
    const scaleY = (imageDimensions?.height || imageRef.current.naturalHeight || rect.height) / rect.height

    const x = Math.max(0, Math.min((clientX - rect.left) * scaleX, imageDimensions?.width || rect.width))
    const y = Math.max(0, Math.min((clientY - rect.top) * scaleY, imageDimensions?.height || rect.height))
    return { x: Math.round(x), y: Math.round(y) }
  }, [imageDimensions])

  // Mouse wheel zoom centered around mouse pointer
  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.2), 10))
  }

  // Mouse Down: Start Pan or Ruler Drawing
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Left click only

    if (isRulerActive) {
      const coords = getImageCoordinates(e.clientX, e.clientY)
      setIsDrawingRuler(true)
      setRulerPoints({
        baseX: coords.x,
        baseY: coords.y,
        tipX: coords.x,
        tipY: coords.y
      })
      return
    }

    // Default: Panning
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  // Mouse Move: Handle Pan, Ruler Drawing, or Loupe Tracking
  const handleMouseMove = (e) => {
    if (isDrawingRuler && rulerPoints) {
      const coords = getImageCoordinates(e.clientX, e.clientY)
      const dx = coords.x - rulerPoints.baseX
      const dy = coords.y - rulerPoints.baseY

      // Calculate bearing angle where 0° is North (up), 90° East (right), 180° South (down), 270° West (left)
      const angleRad = Math.atan2(dx, -dy)
      let bearing = (angleRad * (180 / Math.PI) + 360) % 360
      bearing = Math.round(bearing * 10) / 10

      setRulerPoints(prev => ({ ...prev, tipX: coords.x, tipY: coords.y }))
      if (onShadowAngleChange) {
        onShadowAngleChange(bearing)
      }
      return
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      return
    }

    // Update Loupe position & sample pixel color
    if (isLoupeActive && offscreenCanvasRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const coords = getImageCoordinates(e.clientX, e.clientY)

      setLoupePos({
        clientX: e.clientX - containerRect.left,
        clientY: e.clientY - containerRect.top,
        imgX: coords.x,
        imgY: coords.y
      })

      // Sample pixel color from offscreen canvas
      const ctx = offscreenCanvasRef.current.getContext('2d')
      if (coords.x >= 0 && coords.x < offscreenCanvasRef.current.width && coords.y >= 0 && coords.y < offscreenCanvasRef.current.height) {
        const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')
        const color = { r: pixel[0], g: pixel[1], b: pixel[2], hex }
        setPixelColor(color)
        if (onPixelInspect) {
          onPixelInspect({ x: coords.x, y: coords.y, ...color })
        }
      }

      // Render Magnified Loupe Canvas
      if (loupeCanvasRef.current) {
        const lCtx = loupeCanvasRef.current.getContext('2d')
        const lSize = 160
        loupeCanvasRef.current.width = lSize
        loupeCanvasRef.current.height = lSize

        lCtx.imageSmoothingEnabled = false // Pixelated nearest neighbor for forensics
        lCtx.clearRect(0, 0, lSize, lSize)

        const sampleSize = lSize / loupeZoom
        const srcX = coords.x - sampleSize / 2
        const srcY = coords.y - sampleSize / 2

        lCtx.drawImage(
          offscreenCanvasRef.current,
          srcX, srcY, sampleSize, sampleSize,
          0, 0, lSize, lSize
        )

        // Draw crosshair reticle on loupe
        lCtx.strokeStyle = 'rgba(6, 182, 212, 0.9)' // Cyan crosshair
        lCtx.lineWidth = 1
        lCtx.beginPath()
        // Horizontal
        lCtx.moveTo(0, lSize / 2)
        lCtx.lineTo(lSize / 2 - 8, lSize / 2)
        lCtx.moveTo(lSize / 2 + 8, lSize / 2)
        lCtx.lineTo(lSize, lSize / 2)
        // Vertical
        lCtx.moveTo(lSize / 2, 0)
        lCtx.lineTo(lSize / 2, lSize / 2 - 8)
        lCtx.moveTo(lSize / 2, lSize / 2 + 8)
        lCtx.lineTo(lSize / 2, lSize)
        lCtx.stroke()

        // Center target ring
        lCtx.beginPath()
        lCtx.arc(lSize / 2, lSize / 2, 8, 0, Math.PI * 2)
        lCtx.stroke()
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDrawingRuler(false)
  }

  // Calculate compass cardinal label (N, NE, E, SE, S, SW, W, NW)
  const getCompassDirection = (deg) => {
    const directions = ['Bắc (N)', 'Bắc Đông Bắc (NNE)', 'Đông Bắc (NE)', 'Đông Đông Bắc (ENE)', 'Đông (E)', 'Đông Đông Nam (ESE)', 'Đông Nam (SE)', 'Nam Đông Nam (SSE)', 'Nam (S)', 'Nam Tây Nam (SSW)', 'Tây Nam (SW)', 'Tây Tây Nam (WSW)', 'Tây (W)', 'Tây Tây Bắc (WNW)', 'Tây Bắc (NW)', 'Bắc Tây Bắc (NNW)']
    const idx = Math.round(deg / 22.5) % 16
    return directions[idx]
  }

  // Build CSS filter string
  const filterString = `
    brightness(${1 + brightness / 100})
    contrast(${1 + contrastVal / 100})
    ${invert ? 'invert(1)' : ''}
    ${sharpen ? 'contrast(1.4) drop-shadow(0 0 1px rgba(255,255,255,0.4))' : ''}
  `.trim()

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900/90 border-b border-slate-800/80">
        {/* Left: Viewport & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            title="Phóng to (+)"
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Thu nhỏ (-)"
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handle100Percent}
            title="Tỉ lệ gốc 100%"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleResetView}
            title="Đặt lại khung nhìn (Phím 0 / Esc)"
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Forensic Tools (Loupe & Ruler) */}
        <div className="flex items-center gap-2">
          {/* Loupe Toggle */}
          <button
            onClick={() => {
              setIsLoupeActive(prev => !prev)
              if (!isLoupeActive) setIsRulerActive(false)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isLoupeActive
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Kính Lúp Loupe {isLoupeActive ? `(${loupeZoom}x)` : ''}</span>
          </button>

          {/* Loupe Zoom Switcher (shown when loupe active) */}
          {isLoupeActive && (
            <div className="flex items-center bg-slate-800/90 border border-cyan-500/40 rounded-lg p-0.5">
              {[2, 4, 8].map(z => (
                <button
                  key={z}
                  onClick={() => setLoupeZoom(z)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    loupeZoom === z
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          )}

          {/* Shadow Ruler Toggle */}
          <button
            onClick={() => {
              setIsRulerActive(prev => !prev)
              if (!isRulerActive) setIsLoupeActive(false)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isRulerActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Thước Đo Bóng Nắng</span>
          </button>
        </div>

        {/* Right: Visual Filters Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterBar(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showFilterBar || brightness !== 0 || contrastVal !== 0 || invert || sharpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bộ Lọc Quang Học</span>
          </button>
        </div>
      </div>

      {/* Visual Filter Tray (Expandable) */}
      {showFilterBar && (
        <div className="flex flex-wrap items-center gap-6 px-4 py-2.5 bg-slate-900/95 border-b border-slate-800/80 text-xs">
          {/* Brightness */}
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 w-16">Độ sáng:</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-8">{brightness}%</span>
          </div>

          {/* Contrast */}
          <div className="flex items-center gap-2">
            <Contrast className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 w-18">Tương phản:</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={contrastVal}
              onChange={(e) => setContrastVal(parseInt(e.target.value))}
              className="w-24 accent-blue-400 cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-8">{contrastVal}%</span>
          </div>

          {/* Invert Negative */}
          <button
            onClick={() => setInvert(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              invert ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Âm Bản (Invert)
          </button>

          {/* Sharpen */}
          <button
            onClick={() => setSharpen(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              sharpen ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Làm Sắc Nét (Sharpen)
          </button>

          {/* Reset Filters */}
          {(brightness !== 0 || contrastVal !== 0 || invert || sharpen) && (
            <button
              onClick={() => {
                setBrightness(0)
                setContrastVal(0)
                setInvert(false)
                setSharpen(false)
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 ml-auto"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Main Interactive Canvas / Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 flex items-center justify-center ${
          isRulerActive ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {imageDataUrl ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out'
            }}
            className="relative"
          >
            {/* Main Image with Live Filters */}
            <img
              ref={imageRef}
              src={imageDataUrl}
              alt="Forensic inspection target"
              style={{ filter: filterString }}
              className="max-w-none max-h-[70vh] rounded-lg shadow-2xl pointer-events-none select-none border border-slate-700/50"
              draggable={false}
            />

            {/* Interactive SVG Overlay for Shadow Ruler */}
            {rulerPoints && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                style={{
                  width: imageDimensions?.width || '100%',
                  height: imageDimensions?.height || '100%'
                }}
              >
                <defs>
                  <marker
                    id="ruler-arrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                  </marker>
                </defs>

                {/* Vector Line */}
                <line
                  x1={rulerPoints.baseX}
                  y1={rulerPoints.baseY}
                  x2={rulerPoints.tipX}
                  y2={rulerPoints.tipY}
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  markerEnd="url(#ruler-arrow)"
                />

                {/* Base Anchor Circle */}
                <circle
                  cx={rulerPoints.baseX}
                  cy={rulerPoints.baseY}
                  r="6"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Tip Anchor Circle */}
                <circle
                  cx={rulerPoints.tipX}
                  cy={rulerPoints.tipY}
                  r="8"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
              </svg>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse" />
            <p className="text-sm">Chưa có ảnh nào được tải vào xưởng giám định</p>
          </div>
        )}

        {/* Optical Magnifier Loupe Floating Lens */}
        {isLoupeActive && imageDataUrl && (
          <div
            style={{
              left: `${loupePos.clientX}px`,
              top: `${loupePos.clientY}px`,
              transform: 'translate(-50%, -50%)'
            }}
            className="absolute pointer-events-none z-30 flex flex-col items-center"
          >
            {/* Circular Metallic Lens Ring */}
            <div className="w-40 h-40 rounded-full border-2 border-cyan-400 bg-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.6)] overflow-hidden relative">
              <canvas
                ref={loupeCanvasRef}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-2 text-[10px] font-mono text-cyan-300 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-cyan-800">
                {loupeZoom}x
              </div>
            </div>

            {/* Live Pixel Readout Status Pill */}
            <div className="mt-2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/95 border border-cyan-500/50 text-[11px] font-mono text-slate-200 shadow-xl backdrop-blur-md">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: pixelColor.hex }}
              />
              <span className="text-cyan-400 font-bold">{pixelColor.hex}</span>
              <span className="text-slate-400">
                ({pixelColor.r}, {pixelColor.g}, {pixelColor.b})
              </span>
              <span className="text-slate-500 font-sans">|</span>
              <span className="text-slate-300">
                X:{loupePos.imgX} Y:{loupePos.imgY}
              </span>
            </div>
          </div>
        )}

        {/* Ruler Mode Active Guidance Banner */}
        {isRulerActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-amber-500/90 text-slate-950 font-semibold text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-none animate-pulse">
            <Compass className="w-4 h-4" />
            <span>Kéo chuột từ CHÂN VẬT THỂ (cột, người) đến ĐỈNH BÓNG để đo góc bóng nắng</span>
          </div>
        )}

        {/* Shadow Measurement HUD Overlay */}
        {shadowAngle !== null && shadowAngle !== undefined && (
          <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs backdrop-blur-md shadow-2xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Góc Phương Vị Bóng Nắng
              </div>
              <div className="text-base font-bold text-amber-300 font-mono flex items-center gap-2">
                <span>{shadowAngle}°</span>
                <span className="text-xs font-normal text-slate-300">
                  ({getCompassDirection(shadowAngle)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
