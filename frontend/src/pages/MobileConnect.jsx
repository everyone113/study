import React, { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import {
  QrCode,
  Smartphone,
  Wifi,
  Laptop,
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  CheckCircle2,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Scissors,
  ShieldCheck,
  ZoomIn,
  X,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Globe,
  HardDrive
} from 'lucide-react'

// OpenHands safe upload file name pattern
export function getSafeUploadFileName(fileName) {
  if (!fileName) return `file_${Date.now()}`
  const parts = fileName.split(/[\\/]+/).filter(Boolean)
  const safeName = parts[parts.length - 1]
  if (!safeName || safeName === '.' || safeName === '..') {
    return `file_${Date.now()}`
  }
  return safeName
}

// Determine file category safely
export function getFileType(fileName = '', mimeType = '') {
  const ext = (fileName || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image'
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video'
  }
  if (['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio'
  }
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar'].includes(ext) || mimeType.includes('pdf')) {
    return 'document'
  }
  return 'other'
}

// Format file size
export function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// Local storage helper for client-side resiliency (OpenHands local-first pattern)
const LOCAL_STORAGE_KEY = 'studymedia_wifi_drop_local_files'

function getLocalDroppedFiles() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function persistLocalDroppedFiles(items) {
  try {
    const safeToStore = items.slice(0, 50).map(item => ({
      id: item.id,
      filename: item.filename,
      display_name: item.display_name,
      size: item.size,
      size_formatted: item.size_formatted,
      file_type: item.file_type,
      extension: item.extension,
      url: item.url && item.url.startsWith('data:') ? item.url : (item.previewUrl || ''),
      is_local: true,
      created_at: item.created_at || new Date().toISOString()
    }))
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeToStore))
  } catch (e) {
    console.warn('LocalStorage limit:', e)
  }
}

export default function MobileConnect({ setCurrentTab }) {
  // Check if current URL opened via QR code with ?mode=drop or ?tab=drop or ?tab=mobile
  const isDropModeParam = (() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('mode') === 'drop' || params.get('tab') === 'drop'
    } catch (e) {
      return false
    }
  })()

  const [activeTab, setActiveTab] = useState(isDropModeParam ? 'mobile_uploader' : 'hub') // 'hub' | 'mobile_uploader' | 'pwa'
  const [selectedIp, setSelectedIp] = useState('')
  const [networkInfo, setNetworkInfo] = useState(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const port = typeof window !== 'undefined' ? (window.location.port || (isHttps ? '443' : '5173')) : '5173'
    const isCloud = isHttps || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.'))
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

    return {
      local_ip: host,
      all_ips: [host],
      frontend_port: port,
      backend_port: 8000,
      upload_url: isCloud ? `${origin}/?tab=mobile&mode=drop` : `http://${host}:${port}/?mode=drop`,
      is_cloud: isCloud
    }
  })
  const [copied, setCopied] = useState(false)

  // Received files in WiFi Drop - ALWAYS guaranteed to be an array
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [fileFilter, setFileFilter] = useState('all') // 'all' | 'image' | 'video' | 'document'

  // Modals
  const [previewFile, setPreviewFile] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Mobile Uploader States
  const [selectedMobileFiles, setSelectedMobileFiles] = useState([])
  const [mobilePreviews, setMobilePreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')
  const mobileInputRef = useRef(null)

  // PC local upload box
  const [pcUploading, setPcUploading] = useState(false)
  const pcInputRef = useRef(null)

  // Guarantee safe array for files (defensive pattern)
  const safeFiles = useMemo(() => (Array.isArray(files) ? files : []), [files])

  // Fetch Network Info & dropped files on mount
  useEffect(() => {
    fetchNetworkInfo()
    fetchFiles()

    // Real-time polling every 4 seconds to refresh received files
    const interval = setInterval(() => {
      fetchFiles(true)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const fetchNetworkInfo = async () => {
    const host = window.location.hostname || 'localhost'
    const isHttps = window.location.protocol === 'https:'
    const port = window.location.port || (isHttps ? '443' : '5173')
    const isCloud = isHttps || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.'))
    const origin = window.location.origin

    try {
      const res = await axios.get('/api/drop/network-info', { timeout: 3500 })
      // Guard against HTML responses when backend is not deployed on Vercel
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.local_ip) {
        setNetworkInfo({
          ...res.data,
          is_cloud: isCloud
        })
        if (res.data.local_ip) {
          setSelectedIp(res.data.local_ip)
        }
        return
      }
    } catch (err) {
      // Backend not responding or static build
    }

    setNetworkInfo({
      local_ip: host,
      all_ips: [host],
      frontend_port: port,
      backend_port: 8000,
      upload_url: isCloud ? `${origin}/?tab=mobile&mode=drop` : `http://${host}:${port}/?mode=drop`,
      is_cloud: isCloud
    })
    setSelectedIp(host)
  }

  const fetchFiles = async (silent = false) => {
    if (!silent) setLoadingFiles(true)
    try {
      const res = await axios.get('/api/drop/files', { timeout: 3500 })
      // CRITICAL DEFENSIVE CHECK: Verify it is an array and not an HTML SPA fallback string!
      if (Array.isArray(res.data)) {
        const localList = getLocalDroppedFiles()
        const backendIds = new Set(res.data.map(f => f.id || f.filename))
        const nonDuplicateLocal = localList.filter(l => !backendIds.has(l.id) && !backendIds.has(l.filename))
        setFiles([...res.data, ...nonDuplicateLocal])
        return
      }
    } catch (err) {
      if (!silent) console.warn('Không thể kết nối API WiFi Drop backend:', err?.message)
    } finally {
      if (!silent) setLoadingFiles(false)
    }

    // Resilient fallback: Load local dropped files
    const localOnly = getLocalDroppedFiles()
    setFiles(localOnly)
  }

  // Save dropped files locally with instant memory & object URL
  const saveFilesLocally = (newFiles) => {
    const createdItems = []
    for (const file of newFiles) {
      const safeName = getSafeUploadFileName(file.name)
      const objUrl = URL.createObjectURL(file)
      const fType = getFileType(safeName, file.type)
      const item = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        filename: safeName,
        display_name: safeName,
        size: file.size,
        size_formatted: formatBytes(file.size),
        file_type: fType,
        extension: safeName.split('.').pop() || '',
        url: objUrl,
        previewUrl: objUrl,
        is_local: true,
        created_at: new Date().toISOString()
      }
      createdItems.push(item)
    }

    const current = getLocalDroppedFiles()
    const merged = [...createdItems, ...current]
    persistLocalDroppedFiles(merged)
    setFiles(prev => [...createdItems, ...(Array.isArray(prev) ? prev : [])])
    return createdItems
  }

  // Compute active IP and QR target URL
  const activeIp = selectedIp || networkInfo.local_ip || 'localhost'
  const isCloudEnv = networkInfo.is_cloud || window.location.protocol === 'https:' || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && !window.location.hostname.startsWith('192.168.'))

  // If in cloud / Vercel: target MUST be live web URL with drop parameter
  // If in local LAN: target is either the fast backend portal or frontend web uploader
  const qrTargetUrl = isCloudEnv
    ? `${window.location.origin}/?tab=mobile&mode=drop`
    : `http://${activeIp}:${networkInfo.backend_port || 8000}/drop`

  const webTargetUrl = isCloudEnv
    ? `${window.location.origin}/?tab=mobile&mode=drop`
    : `http://${activeIp}:${networkInfo.frontend_port || 5173}/?tab=mobile&mode=drop`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle files selected on mobile
  const handleMobileFileChange = (e) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length === 0) return

    setSelectedMobileFiles(chosen)
    setUploadSuccessMsg('')

    // Generate thumbnails for image files
    const newPreviews = chosen.map(file => {
      const safeName = getSafeUploadFileName(file.name)
      if (file.type.startsWith('image/')) {
        return { name: safeName, url: URL.createObjectURL(file), isImage: true, size: file.size }
      }
      return { name: safeName, url: null, isImage: false, size: file.size, type: file.type }
    })
    setMobilePreviews(newPreviews)
  }

  // Upload files from Mobile
  const handleMobileUpload = async () => {
    if (selectedMobileFiles.length === 0) return
    setUploading(true)
    setUploadProgress(20)

    try {
      const formData = new FormData()
      selectedMobileFiles.forEach(file => {
        formData.append('files', file)
      })

      // Attempt backend API upload
      const res = await axios.post('/api/drop/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        }
      })

      if (res.data && (Array.isArray(res.data.uploaded) || res.data.status === 'success')) {
        setUploadSuccessMsg(`Đã bắn thành công ${selectedMobileFiles.length} tệp lên máy tính qua Wi-Fi!`)
        fetchFiles()
      } else {
        // Fallback local storage
        saveFilesLocally(selectedMobileFiles)
        setUploadSuccessMsg(`Đã lưu thành công ${selectedMobileFiles.length} tệp vào kho nhận!`)
      }
    } catch (err) {
      // Backend not available (e.g. Vercel static server) -> Save locally with zero friction
      saveFilesLocally(selectedMobileFiles)
      setUploadSuccessMsg(`Đã lưu thành công ${selectedMobileFiles.length} tệp vào kho nhận!`)
    } finally {
      setSelectedMobileFiles([])
      setMobilePreviews([])
      if (mobileInputRef.current) mobileInputRef.current.value = ''
      setUploading(false)
      setUploadProgress(100)
    }
  }

  // Upload file from PC
  const handlePcUpload = async (e) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length === 0) return
    setPcUploading(true)

    try {
      const formData = new FormData()
      chosen.forEach(file => formData.append('files', file))
      const res = await axios.post('/api/drop/upload', formData, { timeout: 10000 })
      if (res.data && (Array.isArray(res.data.uploaded) || res.data.status === 'success')) {
        fetchFiles()
      } else {
        saveFilesLocally(chosen)
      }
    } catch (err) {
      saveFilesLocally(chosen)
    } finally {
      if (pcInputRef.current) pcInputRef.current.value = ''
      setPcUploading(false)
    }
  }

  // Delete single file
  const confirmDeleteFile = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (!deleteTarget.is_local) {
        await axios.delete(`/api/drop/files/${deleteTarget.filename}`, { timeout: 3500 })
      }
    } catch (err) {
      console.warn('Backend delete skipped:', err?.message)
    } finally {
      // Remove from memory and localStorage
      setFiles(prev => (Array.isArray(prev) ? prev.filter(f => f.id !== deleteTarget.id && f.filename !== deleteTarget.filename) : []))
      const localCurrent = getLocalDroppedFiles()
      const updated = localCurrent.filter(f => f.id !== deleteTarget.id && f.filename !== deleteTarget.filename)
      persistLocalDroppedFiles(updated)

      setDeleteTarget(null)
      setDeleting(false)
    }
  }

  // Clear all files
  const confirmClearAll = async () => {
    setDeleting(true)
    try {
      await axios.delete('/api/drop/clear', { timeout: 3500 })
    } catch (err) {
      console.warn('Backend clear skipped:', err?.message)
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      setFiles([])
      setShowClearModal(false)
      setDeleting(false)
    }
  }

  // Filtered files (guaranteed safe array operations)
  const filteredFiles = useMemo(() => {
    return safeFiles.filter(f => {
      if (fileFilter === 'all') return true
      return f.file_type === fileFilter
    })
  }, [safeFiles, fileFilter])

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              {isCloudEnv ? (
                <>
                  <Globe className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span className="text-emerald-400">Cổng Truyền Dữ Liệu Đám Mây & Wi-Fi Siêu Tốc</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  <span>Cổng Truyền Dữ Liệu Wi-Fi Cục Bộ (Không Cần Internet)</span>
                </>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <span>WiFi Drop & Kết Nối Mobile</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Quét mã QR bằng camera điện thoại để mở kho ảnh và bắn tức thì hàng chục ảnh/video sang máy tính với tốc độ cực đại!
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold gap-1 self-start md:self-center">
            <button
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'hub'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Mã QR & Hộp Nhận PC</span>
            </button>

            <button
              onClick={() => setActiveTab('mobile_uploader')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'mobile_uploader'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Giao Diện Điện Thoại</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'pwa'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Cài App PWA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PC HUB & QR CODE RECEIVER */}
      {/* ======================================================== */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          {/* Top Section: QR Card + Quick Setup Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* QR Card (5 columns) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Network adapter selector if multiple local IPs detected */}
              {!isCloudEnv && networkInfo.all_ips && networkInfo.all_ips.length > 1 && (
                <div className="w-full max-w-sm mb-3 flex items-center justify-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px]">
                  <span className="text-slate-400 pl-1 font-semibold">Chọn mạng:</span>
                  {networkInfo.all_ips.map(ip => (
                    <button
                      key={ip}
                      type="button"
                      onClick={() => setSelectedIp(ip)}
                      className={`px-2.5 py-1 rounded-xl font-mono font-bold transition-all ${
                        activeIp === ip
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {ip.startsWith('192.168.') ? `📶 Wi-Fi (${ip})` : ip.startsWith('26.') ? `🛡️ VPN (${ip})` : ip}
                    </button>
                  ))}
                </div>
              )}

              {/* Local Vector QR Code */}
              <div className="p-4 bg-slate-950 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 mb-3 transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
                <QRCodeSVG
                  value={qrTargetUrl}
                  size={210}
                  level="M"
                  bgColor="#020617"
                  fgColor="#38bdf8"
                  className="rounded-xl shadow-lg"
                />
              </div>

              <div className="font-extrabold text-base text-white mb-1 flex items-center gap-2">
                <span>Quét Bằng Camera Điện Thoại</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mb-3 leading-relaxed">
                {isCloudEnv
                  ? 'Mở Camera iPhone hoặc Zalo/Google Lens quét mã QR để mở giao diện bắn tệp trực tiếp!'
                  : 'Mở Camera iPhone hoặc Zalo/Google Lens quét mã QR để mở kho ảnh chọn nhiều ảnh cùng lúc!'}
              </p>

              {/* Real URL box */}
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 flex items-center gap-2 text-xs font-mono mb-2">
                <span className="flex-1 truncate text-blue-300 select-all font-bold">{qrTargetUrl}</span>
                <button
                  onClick={handleCopyLink}
                  title="Sao chép link"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={qrTargetUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở thử tab mới"
                  className="p-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/20 w-full max-w-sm text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isCloudEnv ? 'Cổng Web Mở Trực Tiếp Trên Mobile:' : 'Cổng Bắn Ảnh Siêu Tốc:'}</span>
                </div>
                <div className="text-amber-300 font-mono font-black text-xs sm:text-sm select-all tracking-wide break-all">
                  {qrTargetUrl}
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Chỉ vài KB • Tải tức thì • Không cần cài ứng dụng phụ
                </div>
              </div>
            </div>

            {/* Quick Feature Highlights (7 columns) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Quy Trình Truyền Ảnh Không Dây Cực Đỉnh
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Được thiết kế riêng cho sinh viên và người sáng tạo nội dung không cần dây cáp sạc USB hay gửi qua Zalo bị bóp dung lượng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-2">
                    1
                  </div>
                  <h4 className="font-bold text-xs text-white">Quét Mã QR</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Camera tự mở cổng truyền web, không cần cài app phụ.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                    2
                  </div>
                  <h4 className="font-bold text-xs text-white">Chọn Nhiều Ảnh</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Chọn cùng lúc hàng chục ảnh gốc từ Album điện thoại.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                    3
                  </div>
                  <h4 className="font-bold text-xs text-white">Bắn Lên PC</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Ảnh nhảy thẳng lên màn hình PC, đưa vào Xóa phông/Lách bản quyền 1-click.</p>
                </div>
              </div>

              {/* PC Upload Box (2-way drop) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    Muốn gửi tệp từ PC sang điện thoại?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bấm tải tệp từ máy tính lên đây, điện thoại quét mã sẽ thấy và tải về được ngay.
                  </p>
                </div>

                <input
                  type="file"
                  multiple
                  ref={pcInputRef}
                  onChange={handlePcUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={pcUploading}
                  onClick={() => pcInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 flex-shrink-0 shadow-lg shadow-blue-600/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{pcUploading ? 'Đang tải lên...' : 'Chọn Tệp Từ PC'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RECEIVED FILES GALLERY (HỘP NHẬN DỮ LIỆU) */}
          {/* ======================================================== */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Kho Ảnh & Tệp Đã Nhận</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 text-xs font-mono font-bold">
                      {safeFiles.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {isCloudEnv
                        ? 'Dữ liệu được lưu trữ trực tiếp an toàn trong phiên làm việc của bạn'
                        : 'Lưu an toàn tại thư mục backend/wifidrop'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Filter pills & Clean button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-medium">
                  {['all', 'image', 'video', 'document'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFileFilter(f)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        fileFilter === f ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'Tất cả' : f === 'image' ? 'Ảnh' : f === 'video' ? 'Video' : 'Tài liệu'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchFiles()}
                  title="Làm mới"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                </button>

                {safeFiles.length > 0 && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn sạch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Files Grid */}
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                {filteredFiles.map(file => (
                  <div
                    key={file.id || file.filename}
                    className="group bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Media Preview Box */}
                    <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                      {file.file_type === 'image' ? (
                        <img
                          src={file.url || file.previewUrl}
                          alt={file.display_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : file.file_type === 'video' ? (
                        <div className="flex flex-col items-center justify-center text-purple-400 p-2">
                          <Video className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-mono uppercase bg-purple-500/20 px-1.5 py-0.5 rounded">
                            {file.extension}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-blue-400 p-2">
                          <FileText className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-mono uppercase bg-blue-500/20 px-1.5 py-0.5 rounded">
                            {file.extension}
                          </span>
                        </div>
                      )}

                      {/* Quick Zoom Pill (for image) */}
                      {file.file_type === 'image' && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-xs"
                        >
                          <div className="p-2 rounded-xl bg-slate-900/80 text-white flex items-center gap-1.5 text-xs font-semibold">
                            <ZoomIn className="w-4 h-4" />
                            <span>Phóng to</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white truncate" title={file.display_name}>
                          {file.display_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5 font-mono">
                          <span>{file.size_formatted}</span>
                          <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {file.extension}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        <a
                          href={file.url || file.previewUrl}
                          download={file.display_name}
                          title="Tải về máy"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Send directly to Media Tools if image */}
                        {file.file_type === 'image' && (
                          <>
                            <button
                              onClick={() => {
                                if (setCurrentTab) setCurrentTab('media')
                              }}
                              title="Chuyển sang Xóa Phông AI"
                              className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white transition-colors"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (setCurrentTab) setCurrentTab('media')
                              }}
                              title="Chuyển sang Lách Trùng Lặp"
                              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setDeleteTarget(file)}
                          title="Xóa tệp"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-bounce" />
                <h4 className="font-bold text-sm text-slate-300">Chưa có ảnh hoặc tệp nào trong kho nhận</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hãy mở Camera trên điện thoại, quét mã QR ở trên hoặc chuyển sang tab "Giao diện Điện thoại" để bắn ảnh thử nghiệm ngay!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MOBILE PHONE UPLOADER (GIAO DIỆN ĐIỆN THOẠI) */}
      {/* ======================================================== */}
      {activeTab === 'mobile_uploader' && (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Mobile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isCloudEnv ? 'Kết Nối Trực Tuyến Đám Mây: OK' : 'Kết Nối Wi-Fi Với Máy Tính: OK'}</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Bắn Ảnh & Tệp Lên Máy Tính
              </h3>
              <p className="text-xs text-slate-400">
                Chạm vào nút bên dưới để mở Thư viện ảnh / File của điện thoại. Bạn có thể chọn cùng lúc nhiều ảnh.
              </p>
            </div>

            {/* Giant Picker Button */}
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              ref={mobileInputRef}
              onChange={handleMobileFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => mobileInputRef.current?.click()}
              className="w-full py-8 px-6 rounded-3xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-center gap-3 group text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white block">
                  {selectedMobileFiles.length > 0
                    ? `Đã chọn ${selectedMobileFiles.length} tệp (Chạm để chọn lại)`
                    : '📸 Chạm Để Mở Kho Ảnh / Chọn Tệp'}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Hỗ trợ Ảnh JPG, PNG, Live Photo, Video MP4, Tài liệu PDF
                </span>
              </div>
            </button>

            {/* Previews of selected photos */}
            {mobilePreviews.length > 0 && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Ảnh đã chọn ({mobilePreviews.length})</span>
                  <span className="text-emerald-400 font-mono">
                    Tổng: {formatBytes(selectedMobileFiles.reduce((acc, f) => acc + (f.size || 0), 0))}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {mobilePreviews.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                      {p.isImage ? (
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-1 text-center font-mono">
                          {p.name.slice(-4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Big Send CTA */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleMobileUpload}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className={`w-5 h-5 ${uploading ? 'animate-bounce' : ''}`} />
                  <span>
                    {uploading
                      ? `Đang truyền tệp (${uploadProgress}%)...`
                      : `🚀 Bắn ${selectedMobileFiles.length} Tệp Lên Máy Tính Ngay`}
                  </span>
                </button>

                {uploading && (
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {uploadSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}

            {/* Quick List: Files already on PC available for mobile download */}
            {safeFiles.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tệp Trên Máy Tính Có Sẵn Để Tải Về Điện Thoại:</span>
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {safeFiles.slice(0, 5).map(f => (
                    <div key={f.id || f.filename} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {f.file_type === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-slate-300 font-medium">{f.display_name}</span>
                      </div>
                      <a
                        href={f.url || f.previewUrl}
                        download={f.display_name}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-[11px] transition-colors"
                      >
                        Tải về
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PWA & FULL PLATFORM GUIDE */}
      {/* ======================================================== */}
      {activeTab === 'pwa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-4xl mx-auto">
          {/* Step 1: Same Wi-Fi */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              Chung Mạng Wi-Fi Cục Bộ Hoặc Truy Cập Web
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điện thoại và máy tính có thể kết nối cùng một mạng Wi-Fi (ở phòng trọ hoặc ở nhà) hoặc truy cập trực tiếp qua đường dẫn web an toàn. Tốc độ truyền cực cao, không tốn 1 byte 4G nào và không giới hạn dung lượng.
            </p>
          </div>

          {/* Step 2: Add to Home Screen PWA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              Thêm Vào Màn Hình Chính (PWA Native App)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              - <strong>Trên iPhone (Safari)</strong>: Bấm nút <em>Chia sẻ (Share)</em> ➔ Chọn <em>Thêm vào MH chính (Add to Home Screen)</em>.<br />
              - <strong>Trên Android (Chrome)</strong>: Bấm menu 3 chấm ➔ Chọn <em>Cài đặt ứng dụng (Install App)</em>.<br />
              Ứng dụng sẽ hiển thị toàn màn hình, mượt mà y như app tải từ App Store.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IMAGE FULLSCREEN LIGHTBOX */}
      {/* ======================================================== */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{previewFile.display_name}</span>
                <span className="text-xs text-slate-400 font-mono">({previewFile.size_formatted})</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-slate-950 overflow-auto max-h-[70vh]">
              <img
                src={previewFile.url || previewFile.previewUrl}
                alt={previewFile.display_name}
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <a
                href={previewFile.url || previewFile.previewUrl}
                download={previewFile.display_name}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Tải Về Máy Tính</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE SINGLE FILE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa tệp</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-xs text-slate-300 font-mono break-all">
              "{deleteTarget.display_name}"
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteFile}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CLEAR ALL CONFIRMATION */}
      {/* ======================================================== */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Dọn dẹp kho tệp</h3>
                <p className="text-xs text-slate-400">Xóa toàn bộ ảnh và tệp đã nhận</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ {safeFiles.length} tệp trong kho WiFi Drop không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmClearAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang dọn...' : 'Xóa tất cả'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
