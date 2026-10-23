import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
  ScanSearch,
  Upload,
  FileImage,
  FolderOpen,
  Clipboard,
  RotateCcw,
  Download,
  ShieldCheck,
  Flame,
  Sun,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

import InspectionViewer from '../components/Forensics/InspectionViewer'
import MetadataInspector from '../components/Forensics/MetadataInspector'
import ElaInspector from '../components/Forensics/ElaInspector'
import ChronoSolarEstimator from '../components/Forensics/ChronoSolarEstimator'
import MicroTextOsint from '../components/Forensics/MicroTextOsint'
import { FORENSIC_PRESETS } from '../components/Forensics/samplePresets'
import {
  computeClientHashes,
  parseClientExif,
  decodeFilenameFingerprint
} from '../components/Forensics/clientForensicsUtils'

export default function ForensicsStudioView({ setCurrentTab }) {
  // Current active analytical tab: 'metadata' | 'ela' | 'solar' | 'osint'
  const [activeTab, setActiveTab] = useState('metadata')

  // Loaded image state
  const [currentFile, setCurrentFile] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 })
  const [fileInfo, setFileInfo] = useState(null)
  const [metadata, setMetadata] = useState(null)

  // Interactive shadow angle shared between InspectionViewer and ChronoSolarEstimator
  const [shadowAngle, setShadowAngle] = useState(205.0)

  // Ingestion drag state
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Sẵn sàng giám định. Kéo thả, chọn tệp hoặc nhấn Ctrl + V để dán ảnh.')
  const [backendOnline, setBackendOnline] = useState(true)

  const fileInputRef = useRef(null)

  // 1. Process image file or blob
  const processImageFile = useCallback(async (file, customName = null) => {
    if (!file) return
    const filename = customName || file.name || 'image.jpg'
    setIsAnalyzing(true)
    setStatusMessage(`Đang tải và phân tích cấu trúc tệp: ${filename}...`)

    try {
      // 1. Read as Data URL for canvas rendering
      const dataUrlReader = new FileReader()
      const dataUrlPromise = new Promise((resolve, reject) => {
        dataUrlReader.onload = () => resolve(dataUrlReader.result)
        dataUrlReader.onerror = reject
      })
      dataUrlReader.readAsDataURL(file)
      const dataUrl = await dataUrlPromise
      setImageDataUrl(dataUrl)

      // 2. Measure dimensions
      const img = new Image()
      img.src = dataUrl
      await new Promise((res) => { img.onload = res })
      const dims = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height }
      setImageDimensions(dims)

      // 3. Read ArrayBuffer for Hashes and Binary EXIF
      const bufferReader = new FileReader()
      const bufferPromise = new Promise((resolve, reject) => {
        bufferReader.onload = () => resolve(bufferReader.result)
        bufferReader.onerror = reject
      })
      bufferReader.readAsArrayBuffer(file)
      const arrayBuffer = await bufferPromise

      // 4. Client hashes & client EXIF parsing
      const { md5, sha256 } = await computeClientHashes(arrayBuffer)
      const clientExif = parseClientExif(arrayBuffer)
      const clientFingerprint = decodeFilenameFingerprint(filename)

      const baseFileInfo = {
        filename,
        size_bytes: file.size,
        width: dims.width,
        height: dims.height,
        format: file.type ? file.type.split('/')[1]?.toUpperCase() : 'JPEG',
        mode: 'RGB',
        md5,
        sha256
      }
      setFileInfo(baseFileInfo)
      setCurrentFile(file)

      // 5. Query backend /api/forensics/analyze for deep EXIF/IPTC/XMP & NOAA calculations
      let serverAnalyzed = false
      try {
        const formData = new FormData()
        formData.append('file', file, filename)
        const res = await axios.post('/api/forensics/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 6000
        })

        if (res.data && res.data.status === 'success') {
          const d = res.data
          setMetadata({
            filename,
            file_info: d.file_info || baseFileInfo,
            camera: d.camera || d.exif || clientExif,
            exif: d.exif || d.camera || clientExif,
            gps: d.gps || clientExif.gps,
            fingerprint: d.fingerprint || clientFingerprint,
            tampering_indicators: d.tampering_indicators || {
              software_detected: !!(d.camera?.software || clientExif?.software),
              software_name: d.camera?.software || clientExif?.software,
              exif_scrubbed: !d.exif?.has_exif,
              warnings: []
            }
          })
          serverAnalyzed = true
          setBackendOnline(true)
        }
      } catch (err) {
        serverAnalyzed = false
        setBackendOnline(false)
      }

      // If backend was unreachable, assemble clean client-side metadata
      if (!serverAnalyzed) {
        const hasSoftware = !!clientExif.software && /photoshop|lightroom|gimp|snapseed|canva/i.test(clientExif.software)
        setMetadata({
          filename,
          file_info: baseFileInfo,
          camera: clientExif,
          exif: clientExif,
          gps: clientExif.gps,
          fingerprint: clientFingerprint,
          tampering_indicators: {
            software_detected: hasSoftware,
            software_name: clientExif.software,
            exif_scrubbed: !clientExif.has_exif,
            warnings: hasSoftware ? [`Phát hiện dấu vết phần mềm ${clientExif.software}`] : []
          }
        })
      }

      setStatusMessage(`Giám định hoàn tất: ${filename} (${dims.width}x${dims.height}px)`)
    } catch (err) {
      console.error('Forensics load error:', err)
      setStatusMessage('Lỗi phân tích tệp: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // 2. Load Preset Image in 1 Click
  const loadPreset = useCallback(async (preset) => {
    setIsAnalyzing(true)
    setStatusMessage(`Đang tải mẫu giám định thực địa: ${preset.title}...`)
    try {
      const dataUrl = preset.getImageDataUrl()
      setImageDataUrl(dataUrl)

      const img = new Image()
      img.src = dataUrl
      await new Promise(res => { img.onload = res })
      const dims = { width: img.naturalWidth || 800, height: img.naturalHeight || 600 }
      setImageDimensions(dims)

      // Convert data URL to Blob for backend ELA requests
      const byteString = atob(dataUrl.split(',')[1])
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      const file = new File([blob], preset.filename, { type: mimeString })
      setCurrentFile(file)

      const { md5, sha256 } = await computeClientHashes(ab)
      const baseFileInfo = {
        filename: preset.filename,
        size_bytes: blob.size,
        width: dims.width,
        height: dims.height,
        format: 'JPEG',
        mode: 'RGB',
        md5,
        sha256
      }
      setFileInfo(baseFileInfo)

      // Set Mock / Analyzed Metadata
      setMetadata({
        filename: preset.filename,
        file_info: baseFileInfo,
        camera: preset.mockData.camera,
        exif: preset.mockData.camera,
        gps: preset.mockData.gps,
        fingerprint: preset.mockData.fingerprint,
        tampering_indicators: preset.mockData.tampering_indicators
      })

      if (preset.initialShadowAngle) {
        setShadowAngle(preset.initialShadowAngle)
      }

      // Auto-switch to most relevant tab for this preset
      if (preset.category === 'ela') setActiveTab('ela')
      else if (preset.category === 'solar') setActiveTab('solar')
      else if (preset.category === 'osint') setActiveTab('osint')
      else setActiveTab('metadata')

      setStatusMessage(`Đã nạp mẫu: ${preset.title} (${preset.filename})`)
    } catch (err) {
      console.error('Preset loading failed:', err)
      setStatusMessage('Lỗi nạp mẫu: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // Auto-load starter preset on first mount if empty
  useEffect(() => {
    if (!imageDataUrl && FORENSIC_PRESETS.length > 0) {
      loadPreset(FORENSIC_PRESETS[0])
    }
  }, [imageDataUrl, loadPreset])

  // 3. Global Ctrl + V Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = (e) => {
      // Don't intercept if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            processImageFile(file, `pasted_clipboard_${timestamp}.png`)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [processImageFile])

  // 4. Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        processImageFile(file)
      } else {
        alert('Vui lòng chỉ thả tệp hình ảnh (JPEG, PNG, WEBP).')
      }
    }
  }

  // 5. Export Forensic Dossier JSON
  const handleExportDossier = () => {
    if (!metadata) return
    const dossier = {
      title: 'BÁO CÁO GIÁM ĐỊNH ẢNH KỸ THUẬT SỐ — STUDYMEDIAHUB FORENSICS',
      timestamp: new Date().toISOString(),
      file_summary: fileInfo,
      exif_metadata: metadata.camera,
      gps_geolocation: metadata.gps,
      filename_fingerprint: metadata.fingerprint,
      tampering_analysis: metadata.tampering_indicators,
      chrono_solar_analysis: {
        shadow_bearing_deg: shadowAngle,
        reference_date: metadata.camera?.datetime_original
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dossier, null, 2))
    const a = document.createElement('a')
    a.href = dataStr
    a.download = `forensic_report_${metadata.filename || 'case'}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. STUDIO HEADER & ACTION BAR                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Cyan Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30">
              <ScanSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  Xưởng Giám Định Ảnh Số (Photo Forensics Studio)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  STUDIO v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trích xuất siêu dữ liệu EXIF/GPS ẩn • Phát hiện ảnh cắt ghép ELA • Thước đo bóng nắng Chronolocation • Soi chi tiết quang học
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 z-10 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) processImageFile(e.target.files[0])
            }}
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Tải Ảnh Mới</span>
          </button>
          <button
            onClick={handleExportDossier}
            disabled={!metadata}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700/80 cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Xuất Hồ Sơ (JSON)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRESET SAMPLES TRAY (1-CLICK FORENSIC TESTING)                          */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mẫu ảnh thực nghiệm 1-chạm (Dùng ngay không cần tải tệp):</span>
          </span>
          <span className="text-slate-500 text-[11px]">
            Hỗ trợ dán ảnh bằng phím tắt <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Ctrl + V</kbd>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {FORENSIC_PRESETS.map((preset) => {
            const isCurrent = fileInfo?.filename === preset.filename
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>
                  <div className={`font-bold text-xs truncate ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {preset.title}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {preset.shortDesc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE: VIEWER (LEFT) + INVESTIGATION TABS (RIGHT)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Interactive Inspection Viewer */}
        <div className="lg:col-span-7 h-[680px]">
          <InspectionViewer
            imageDataUrl={imageDataUrl}
            imageDimensions={imageDimensions}
            shadowAngle={shadowAngle}
            onShadowAngleChange={(angle) => setShadowAngle(angle)}
          />
        </div>

        {/* Right Column (5 cols): Analytical Panels & Tabs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tab Navigation Buttons */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            {[
              { id: 'metadata', label: 'EXIF / GPS', icon: FileText, color: 'text-cyan-400' },
              { id: 'ela', label: 'Cắt Ghép ELA', icon: Flame, color: 'text-rose-400' },
              { id: 'solar', label: 'Bóng Nắng', icon: Sun, color: 'text-amber-400' },
              { id: 'osint', label: 'Chữ & OSINT', icon: Search, color: 'text-purple-400' }
            ].map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md shadow-slate-950/60 border border-slate-700/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 mb-1 ${isActive ? tab.color : 'text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="max-h-[610px] overflow-y-auto pr-1">
            {activeTab === 'metadata' && (
              <MetadataInspector
                metadata={metadata}
                fileInfo={fileInfo}
              />
            )}

            {activeTab === 'ela' && (
              <ElaInspector
                originalDataUrl={imageDataUrl}
                fileBlob={currentFile}
                filename={fileInfo?.filename}
              />
            )}

            {activeTab === 'solar' && (
              <ChronoSolarEstimator
                gps={metadata?.gps}
                exifDate={metadata?.camera?.datetime_original}
                shadowAngle={shadowAngle}
                onShadowAngleChange={(a) => setShadowAngle(a)}
              />
            )}

            {activeTab === 'osint' && (
              <MicroTextOsint
                imageDataUrl={imageDataUrl}
                filename={fileInfo?.filename}
              />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAG & DROP INGESTION DROPZONE (EXPANDABLE / BOTTOM)                    */}
      {/* ========================================================================= */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
        }`}
      >
        <Upload className={`w-7 h-7 mx-auto mb-2 transition-transform ${isDragOver ? 'scale-125 text-cyan-400' : 'text-slate-500'}`} />
        <div className="text-xs font-semibold text-slate-300">
          Kéo thả ảnh cần giám định vào đây, chọn tệp từ máy tính, hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300">Ctrl + V</kbd> để dán ảnh
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Hỗ trợ định dạng JPEG, PNG, WEBP, TIFF. Toàn bộ quá trình tính toán ELA và giải mã siêu dữ liệu được bảo mật tuyệt đối.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 5. FORENSIC STATUS BAR                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-mono text-slate-300">
            {backendOnline ? 'Máy chủ Giám Định: Sẵn sàng (/api/forensics)' : 'Chế độ Cục Bộ (Client-Side Fallback Engine)'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 truncate max-w-xs">{statusMessage}</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
          {fileInfo && (
            <>
              <span>MD5: {fileInfo.md5?.substring(0, 10)}...</span>
              <span>SHA-256: {fileInfo.sha256?.substring(0, 10)}...</span>
              <span className="text-cyan-400 font-bold">{fileInfo.width}×{fileInfo.height}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
