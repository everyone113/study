import React, { useState } from 'react'
import axios from 'axios'
import {
  Video,
  Download,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Sliders,
  Scissors,
  AlertCircle,
  X
} from 'lucide-react'

import { removeBackgroundClient, compressImageForUpload } from '../utils/bgRemoverClient'
import { processImageAntiDuplicateClient, processVideoAntiDuplicateClient } from '../utils/antiDuplicateClient'

export default function MediaStudio() {
  const [toast, setToast] = useState(null) // { type: 'success' | 'error' | 'info', message: '' }

  const playChime = (type = 'info') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'error') {
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24) // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36) // C6
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2)
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    } catch (e) {}
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    playChime(type)
    setTimeout(() => setToast(null), 4000)
  }

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem('studymedia_media_tab')
      if (savedTab) {
        localStorage.removeItem('studymedia_media_tab')
        return savedTab
      }
    } catch (e) {}
    return 'downloader'
  })

  // Video Downloader states
  const [dlUrl, setDlUrl] = useState('')
  const [dlLoading, setDlLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState(null)
  const [downloadResult, setDownloadResult] = useState(null)

  // Anti Duplicate states
  const [antiDupType, setAntiDupType] = useState('video') // 'video' | 'image'
  const [antiFile, setAntiFile] = useState(null)
  const [antiPreview, setAntiPreview] = useState(null)
  const [antiSpeed, setAntiSpeed] = useState(1.008)
  const [antiMicroZoom, setAntiMicroZoom] = useState(true)
  const [antiLoading, setAntiLoading] = useState(false)
  const [antiResult, setAntiResult] = useState(null)

  const handleAntiFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAntiFile(file)
      setAntiPreview(URL.createObjectURL(file))
      setAntiResult(null)
    }
  }

  // Background Remover states
  const [bgFile, setBgFile] = useState(null)
  const [bgPreview, setBgPreview] = useState(null)
  const [bgLoading, setBgLoading] = useState(false)
  const [bgResult, setBgResult] = useState(null)
  const [bgTolerance, setBgTolerance] = useState(42)
  const [bgFeather, setBgFeather] = useState(16)
  const [showBgSettings, setShowBgSettings] = useState(false)

  const handleBgFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setBgFile(file)
      setBgPreview(URL.createObjectURL(file))
      setBgResult(null)
    }
  }

  // Auto-import image if navigated from WiFi Drop
  React.useEffect(() => {
    try {
      const rawImport = localStorage.getItem('studymedia_import_image')
      if (rawImport) {
        localStorage.removeItem('studymedia_import_image')
        const item = JSON.parse(rawImport)
        if (item && item.url) {
          fetch(item.url)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], item.name || 'imported_image.png', { type: blob.type || 'image/png' })
              if (activeTab === 'nobg') {
                setBgFile(file)
                setBgPreview(URL.createObjectURL(file))
                setBgResult(null)
              } else if (activeTab === 'antidup') {
                setAntiDupType('image')
                setAntiFile(file)
                setAntiPreview(URL.createObjectURL(file))
                setAntiResult(null)
              }
            })
            .catch(() => {})
        }
      }
    } catch (e) {}
  }, [activeTab])

  // Helper to trigger direct browser download
  const triggerDirectDownload = async (fileUrl, filename) => {
    try {
      const resp = await fetch(fileUrl)
      if (!resp.ok) throw new Error('Fetch status: ' + resp.status)
      const blob = await resp.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000)
    } catch (e) {
      window.open(fileUrl, '_blank')
    }
  }

  // 1. Fetch Video Info
  const handleFetchInfo = async (e) => {
    e.preventDefault()
    if (!dlUrl.trim()) return
    setDlLoading(true)
    setVideoInfo(null)
    setDownloadResult(null)

    const isTikTok = ['tiktok.com', 'douyin.com', 'v.douyin.com'].some(k => dlUrl.toLowerCase().includes(k))

    // Helper to fetch directly from TikWM API
    const fetchTikWM = async (url) => {
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url.trim())}`)
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data
        return {
          title: d.title || 'Video TikTok Sạch Logo',
          thumbnail: d.cover || '',
          duration: d.duration || 0,
          uploader: d.author?.nickname || 'TikTok Creator',
          platform: 'TikTok (Sạch Logo)',
          description: d.title || '',
          url: url,
          clean_video_url: d.play || d.hdplay,
          hd_video_url: d.hdplay || d.play,
          clean_audio_url: d.music,
          isDirectClient: true
        }
      }
      throw new Error(res.data?.msg || 'Không thể giải mã video TikTok từ liên kết này.')
    }

    try {
      // Priority 1 for TikTok: Try direct TikWM API first (super fast, works seamlessly on Vercel without backend)
      if (isTikTok) {
        try {
          const directData = await fetchTikWM(dlUrl)
          setVideoInfo(directData)
          return
        } catch (tikwmErr) {
          console.warn('TikWM direct resolution failed, trying backend...', tikwmErr)
        }
      }

      // Priority 2: Backend resolution
      try {
        const res = await axios.post('/api/media/info', { url: dlUrl })
        setVideoInfo(res.data)
      } catch (backendErr) {
        if (isTikTok) {
          throw new Error('Không thể lấy thông tin video TikTok. Vui lòng kiểm tra lại link.')
        }

        if (backendErr.response?.status === 405 || backendErr.response?.status === 404 || !backendErr.response) {
          throw new Error(
            'Trên bản Web Vercel hiện tại, tính năng tải trực tiếp hỗ trợ siêu tốc TikTok/Douyin (Sạch Logo & Âm Thanh). ' +
            'Để tải YouTube với chất lượng cao nhất, vui lòng khởi chạy Backend trên máy tính!'
          )
        }
        throw backendErr
      }
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Không thể lấy thông tin video. Vui lòng kiểm tra lại link.', 'error')
    } finally {
      setDlLoading(false)
    }
  }

  // Download Video / Audio
  const handleDownload = async (formatType) => {
    setDlLoading(true)
    try {
      const isAudio = formatType === 'audio'
      const isHd = formatType === 'video_hd'
      const directTargetUrl = isAudio 
        ? videoInfo?.clean_audio_url 
        : (isHd ? (videoInfo?.hd_video_url || videoInfo?.clean_video_url) : (videoInfo?.clean_video_url || videoInfo?.hd_video_url))

      // If backend is running and we didn't resolve directly via client
      if (!videoInfo?.isDirectClient) {
        try {
          const res = await axios.post('/api/media/download', {
            url: dlUrl,
            format_type: isAudio ? 'audio' : 'video'
          })
          setDownloadResult(res.data)
          return
        } catch (apiErr) {
          if (!directTargetUrl) {
            throw apiErr
          }
        }
      }

      // Direct client-side download
      if (directTargetUrl) {
        const ext = isAudio ? 'mp3' : 'mp4'
        const safeTitle = (videoInfo.title || 'video')
          .replace(/[\\/*?:"<>|]/g, '')
          .slice(0, 40)
          .trim() || 'video_clean'
        const filename = `${safeTitle}_no_watermark.${ext}`

        await triggerDirectDownload(directTargetUrl, filename)
        setDownloadResult({
          filename: filename,
          download_url: directTargetUrl,
          isDirect: true
        })
      } else {
        throw new Error('Không tìm thấy link tải trực tiếp cho định dạng này.')
      }
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Lỗi khi tải video', 'error')
    } finally {
      setDlLoading(false)
    }
  }

  // 2. Anti-Duplicate Process (Dual Engine: Local Desktop AI/FFmpeg + Client-Side High-Speed Engine)
  const handleAntiDupSubmit = async (e) => {
    e.preventDefault()
    if (!antiFile) return
    setAntiLoading(true)
    setAntiResult(null)

    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    let backendSuccess = false

    // Try desktop backend if running on localhost / desktop workstation
    if (isLocalHost) {
      try {
        const formData = new FormData()
        formData.append('file', antiFile)

        let res
        if (antiDupType === 'video') {
          formData.append('speed_factor', antiSpeed)
          formData.append('micro_zoom', antiMicroZoom)
          res = await axios.post('/api/media/anti-duplicate/video', formData, { timeout: 60000 })
        } else {
          formData.append('mode', 'smart')
          res = await axios.post('/api/media/anti-duplicate/image', formData, { timeout: 15000 })
        }

        if (res.data && res.data.status === 'success') {
          setAntiResult({
            ...res.data,
            engine: antiDupType === 'video' ? 'backend_ffmpeg' : 'backend_pillow',
            processed_url: res.data.data_url || res.data.processed_url
          })
          backendSuccess = true
        }
      } catch (backendErr) {
        console.warn('[AntiDup Backend] Local backend not responding or error, falling back to client engine:', backendErr)
      }
    }

    // Client-side engine (Runs 100% on Vercel, offline, or when backend is unavailable)
    if (!backendSuccess) {
      try {
        let clientRes
        if (antiDupType === 'video') {
          clientRes = await processVideoAntiDuplicateClient(antiFile)
        } else {
          clientRes = await processImageAntiDuplicateClient(antiFile)
        }
        setAntiResult(clientRes)
      } catch (clientErr) {
        console.error('[AntiDup Client Error]:', clientErr)
        showToast('Lỗi khi xử lý lách trùng lặp: ' + (clientErr.message || 'Không thể can thiệp dữ liệu'), 'error')
      }
    }

    setAntiLoading(false)
  }

  // 3. Background Removal (Dual Engine: Local U2-Net AI + Client-Side High-Speed Canvas)
  const handleBgRemoval = async (e, customTolerance = null, customFeather = null) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!bgFile) return
    setBgLoading(true)

    try {
      const tol = customTolerance ?? bgTolerance
      const fea = customFeather ?? bgFeather
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      let backendSuccess = false

      // Try local U2-Net AI if running on localhost / desktop environment
      if (isLocalHost) {
        try {
          const optimizedFile = await compressImageForUpload(bgFile, 1920, 0.9)
          const formData = new FormData()
          formData.append('file', optimizedFile)
          const res = await axios.post('/api/tools/remove-bg', formData, { timeout: 12000 })
          if (res.data && (res.data.data_url || res.data.result_url)) {
            setBgResult({
              ...res.data,
              engine: 'ai_u2net'
            })
            backendSuccess = true
          }
        } catch (backendErr) {
          console.warn('[AI Backend] Local backend not responding or timeout, falling back to client canvas engine:', backendErr)
        }
      }

      // If on Vercel (or backend not reachable), run instant client-side canvas engine
      if (!backendSuccess) {
        const clientRes = await removeBackgroundClient(bgFile, {
          tolerance: tol,
          feather: fea
        })
        setBgResult({
          ...clientRes,
          result_filename: `nobg_${(bgFile.name || 'image').replace(/\.[^/.]+$/, '')}.png`,
          engine: 'client_canvas'
        })
      }
    } catch (err) {
      console.error('[Background Removal Error]:', err)
      showToast('Không thể tách nền: ' + (err.message || 'Lỗi xử lý ảnh'), 'error')
    } finally {
      setBgLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header & Tab Switching */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Xưởng Sáng Tạo Media & Lách Bản Quyền MXH
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Bộ công cụ tải video sạch logo, tách nền ảnh và can thiệp chữ ký số video để đăng mạng xã hội không bị quét trùng
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('downloader')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'downloader' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Tải Video Sạch Logo
            </button>
            <button
              onClick={() => setActiveTab('antidup')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'antidup' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Lách Quét Trùng Lặp
            </button>
            <button
              onClick={() => setActiveTab('nobg')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'nobg' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Tách Nền AI
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: VIDEO DOWNLOADER */}
      {activeTab === 'downloader' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3">
              Dán link video TikTok hoặc YouTube
            </h3>

            <form onSubmit={handleFetchInfo} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                placeholder="https://www.tiktok.com/@user/video/... hoặc https://youtube.com/shorts/..."
                value={dlUrl}
                onChange={e => setDlUrl(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs md:text-sm font-mono focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={dlLoading}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Download className="w-4 h-4" />
                <span>{dlLoading ? 'Đang phân tích...' : 'Lấy Link Tải'}</span>
              </button>
            </form>
          </div>

          {videoInfo && (
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
              {videoInfo.thumbnail && (
                <div className="w-full md:w-56 h-40 md:h-auto rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0">
                  <img
                    src={videoInfo.thumbnail}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold">
                    {videoInfo.platform}
                  </span>
                  <h4 className="font-bold text-base md:text-lg text-white mt-2 leading-snug">
                    {videoInfo.title}
                  </h4>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <div>Tác giả: <span className="text-slate-200">{videoInfo.uploader}</span></div>
                    {videoInfo.duration > 0 && <div>Thời lượng: {videoInfo.duration} giây</div>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleDownload('video')}
                    disabled={dlLoading}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{dlLoading ? 'Đang tải...' : 'Tải Video MP4 (Sạch Logo)'}</span>
                  </button>

                  {videoInfo.hd_video_url && videoInfo.hd_video_url !== videoInfo.clean_video_url && (
                    <button
                      onClick={() => handleDownload('video_hd')}
                      disabled={dlLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{dlLoading ? 'Đang tải...' : 'Tải Bản Siêu Nét HD'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload('audio')}
                    disabled={dlLoading}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{dlLoading ? 'Đang tải...' : 'Tải Âm Thanh MP3'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {downloadResult && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Video đã sẵn sàng để tải về máy!</h4>
                  <p className="text-xs text-emerald-400/90 font-mono mt-0.5 truncate max-w-xs md:max-w-md">{downloadResult.filename}</p>
                </div>
              </div>

              <button
                onClick={() => triggerDirectDownload(downloadResult.download_url, downloadResult.filename)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Lưu Về Máy Ngay</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANTI DUPLICATE PROCESSOR */}
      {activeTab === 'antidup' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Bộ Lọc Lách Quét Trùng Lặp (TikTok, Reels, Shorts)
              </h3>

              <div className="flex bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => { setAntiDupType('video'); setAntiFile(null); setAntiPreview(null); setAntiResult(null); }}
                  className={`px-3 py-1 rounded-lg ${antiDupType === 'video' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Xử lý Video
                </button>
                <button
                  type="button"
                  onClick={() => { setAntiDupType('image'); setAntiFile(null); setAntiPreview(null); setAntiResult(null); }}
                  className={`px-3 py-1 rounded-lg ${antiDupType === 'image' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Xử lý Ảnh
                </button>
              </div>
            </div>

            <form onSubmit={handleAntiDupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Chọn tệp {antiDupType === 'video' ? 'Video (MP4, MOV)' : 'Hình Ảnh (JPG, PNG)'} cần lách bản quyền:
                </label>
                <input
                  type="file"
                  required
                  accept={antiDupType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleAntiFileSelect}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
              </div>

              {antiPreview && !antiResult && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-800 animate-in fade-in">
                  {antiDupType === 'image' ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-700">
                      <img src={antiPreview} alt="Gốc" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-700 flex items-center justify-center text-purple-400">
                      <Video className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-xs text-slate-300 space-y-0.5 truncate">
                    <p className="font-medium truncate">{antiFile?.name}</p>
                    <p className="text-[10px] text-slate-500">{(antiFile?.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng xử lý</p>
                  </div>
                </div>
              )}

              {antiDupType === 'video' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vi chỉnh tốc độ (Speed Shift): {antiSpeed}x
                    </label>
                    <input
                      type="range"
                      min="1.002"
                      max="1.03"
                      step="0.002"
                      value={antiSpeed}
                      onChange={e => setAntiSpeed(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      Thay đổi thời lượng và âm phổ mili-giây không làm méo tiếng
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-4 sm:pt-0">
                    <input
                      type="checkbox"
                      id="microzoom"
                      checked={antiMicroZoom}
                      onChange={e => setAntiMicroZoom(e.target.checked)}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                    <label htmlFor="microzoom" className="text-xs text-slate-300 cursor-pointer">
                      Micro-zoom (Cắt viền 2px chống thuật toán quét khung hình đối xứng)
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={antiLoading || !antiFile}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>{antiLoading ? 'Đang can thiệp dữ liệu & tái tạo chữ ký số...' : 'Tiến Hành Lách Thuật Toán'}</span>
              </button>
            </form>
          </div>

          {antiResult && (
            <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-base text-white">Xử lý hoàn tất! File đã có chữ ký số mới tinh</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40 font-medium">
                    {antiResult.engine?.includes('backend') ? '✨ FFmpeg Deep Engine (Desktop)' : '⚡ Web Client Engine (Vercel Siêu Tốc)'}
                  </span>
                  {antiResult.elapsed_seconds && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {antiResult.elapsed_seconds}s
                    </span>
                  )}
                </div>
              </div>

              {/* Media Preview Player */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Xem trước tệp đã lách:</span>
                <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex items-center justify-center">
                  {antiDupType === 'video' ? (
                    <video
                      src={antiResult.processed_url}
                      controls
                      playsInline
                      className="max-h-72 max-w-full rounded-xl"
                    />
                  ) : (
                    <img
                      src={antiResult.processed_url}
                      alt="Kết quả"
                      className="max-h-72 max-w-full rounded-xl object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Cryptographic Hash Comparison (MD5 + SHA-256) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  So sánh chữ ký số nhị phân (Bằng chứng vượt bộ lọc trùng lặp):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[11px] font-sans font-medium">Chữ Ký MD5 Gốc:</span>
                    <span className="text-red-400 break-all text-[11px]">{antiResult.original_md5}</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
                    <span className="text-slate-500 block text-[11px] font-sans font-medium">Chữ Ký MD5 Mới (Sau Biến Đổi):</span>
                    <span className="text-emerald-400 break-all text-[11px]">{antiResult.new_md5}</span>
                  </div>
                </div>

                {antiResult.original_sha256 && antiResult.new_sha256 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[11px] font-sans font-medium">Mã SHA-256 Gốc:</span>
                      <span className="text-red-400/80 break-all text-[10px]">{antiResult.original_sha256}</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
                      <span className="text-slate-500 block text-[11px] font-sans font-medium">Mã SHA-256 Mới (Độc Bản):</span>
                      <span className="text-emerald-400/90 break-all text-[10px]">{antiResult.new_sha256}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Applied Tricks List */}
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800/60">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Các kỹ thuật đã áp dụng để vượt qua thuật toán quét:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {antiResult.applied_tricks.map((trick, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></span>
                      <span>{trick}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-400">
                  Tệp đã sẵn sàng với mã băm và siêu dữ liệu hoàn toàn mới, bạn có thể đăng tải trực tiếp lên TikTok, Reels hoặc Shorts mà không lo bị hạn chế tương tác.
                </p>
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(antiResult.processed_url, antiResult.processed_filename)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 whitespace-nowrap transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Tệp Đã Lách Về Máy</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* TAB 3: AI BACKGROUND REMOVER */}
      {activeTab === 'nobg' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-400" />
              Tách Nền Vật Thể & Chủ Thể Bằng AI Siêu Tốc (U²-Net)
            </h3>

            <form onSubmit={handleBgRemoval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Chọn ảnh chứa vật thể hoặc người cần xóa phông:
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleBgFileSelect}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
              </div>

              {bgPreview && !bgResult && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-700">
                    <img src={bgPreview} alt="Gốc" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5 truncate">
                    <p className="font-medium truncate">{bgFile?.name}</p>
                    <p className="text-[10px] text-slate-500">{(bgFile?.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng tách nền</p>
                  </div>
                </div>
              )}

              {/* Advanced Fine-Tuning Controls */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowBgSettings(!showBgSettings)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showBgSettings ? 'Ẩn tùy chỉnh độ nhạy' : 'Tùy chỉnh nâng cao (Độ nhạy & Độ mềm viền)'}</span>
                </button>

                {showBgSettings && (
                  <div className="mt-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-4 animate-in fade-in">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Độ nhạy nhận diện nền (Tolerance):</span>
                        <span className="text-purple-400">{bgTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="85"
                        value={bgTolerance}
                        onChange={(e) => setBgTolerance(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Chặt chẽ (Giữ nguyên vật thể)</span>
                        <span>Mạnh mẽ (Tách sạch phông nền)</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Độ mềm mịn viền (Feathering):</span>
                        <span className="text-purple-400">{bgFeather}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="35"
                        value={bgFeather}
                        onChange={(e) => setBgFeather(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Viền sắc cạnh</span>
                        <span>Viền chuyển mượt tự nhiên</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={bgLoading || !bgFile}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Scissors className="w-4 h-4" />
                <span>{bgLoading ? 'Hệ thống đang phân tích & tách nền...' : 'Xóa Phông Nền (PNG Transparent)'}</span>
              </button>
            </form>
          </div>

          {bgResult && (
            <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-base text-white">Ảnh Đã Xóa Phông Thành Công!</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40 font-medium">
                    {bgResult.engine === 'ai_u2net' ? '✨ AI U²-Net Engine' : '⚡ Web Canvas Engine (Vercel Siêu Tốc)'}
                  </span>
                  {bgResult.elapsed_seconds && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {bgResult.elapsed_seconds}s
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                {bgPreview && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400">Ảnh Gốc:</span>
                    <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                      <img src={bgPreview} alt="Original" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                )}

                {/* Transparent Result */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-400">Kết Quả Nền Trong Suốt (PNG):</span>
                    {bgResult.width && bgResult.height && (
                      <span className="text-[11px] text-slate-500">{bgResult.width} × {bgResult.height}px</span>
                    )}
                  </div>
                  <div
                    className="w-full h-64 rounded-2xl overflow-hidden border border-purple-500/30 flex items-center justify-center p-2 shadow-inner"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  >
                    <img
                      src={bgResult.data_url || bgResult.result_url}
                      alt="Transparent result"
                      className="max-w-full max-h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-400">
                  Nền ảnh đã được chuyển đổi hoàn toàn sang kênh alpha trong suốt (PNG), bạn có thể ném vào Photoshop, Canva, CapCut hoặc ghép vào video mà không bị viền trắng.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {showBgSettings && (
                    <button
                      type="button"
                      onClick={() => handleBgRemoval(null, bgTolerance, bgFeather)}
                      disabled={bgLoading}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 whitespace-nowrap transition-all"
                    >
                      <span>Tách lại</span>
                    </button>
                  )}
                  <a
                    href={bgResult.data_url || bgResult.result_url}
                    download={bgResult.result_filename || 'anh_tach_nen.png'}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 whitespace-nowrap transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Ảnh PNG Trong Suốt</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-indigo-950/50'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 hover:opacity-80 rounded-lg shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
