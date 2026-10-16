import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
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
  ArrowRight
} from 'lucide-react'

export default function MobileConnect({ setCurrentTab }) {
  // Check if current URL opened via QR code with ?mode=drop or ?tab=drop
  const isDropModeParam = (() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('mode') === 'drop' || params.get('tab') === 'drop'
    } catch (e) {
      return false
    }
  })()

  const [activeTab, setActiveTab] = useState(isDropModeParam ? 'mobile_uploader' : 'hub') // 'hub' | 'mobile_uploader' | 'pwa'
  const [networkInfo, setNetworkInfo] = useState({
    local_ip: '127.0.0.1',
    frontend_port: 5173,
    backend_port: 8000,
    upload_url: ''
  })
  const [copied, setCopied] = useState(false)

  // Received files in WiFi Drop
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

  // Fetch Network Info & dropped files on mount
  useEffect(() => {
    fetchNetworkInfo()
    fetchFiles()

    // Real-time polling every 3.5 seconds to refresh received files on PC
    const interval = setInterval(() => {
      fetchFiles(true)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const fetchNetworkInfo = async () => {
    try {
      const res = await axios.get('/api/drop/network-info')
      setNetworkInfo(res.data)
    } catch (err) {
      console.error('Không thể lấy thông tin mạng:', err)
      const host = window.location.hostname
      const port = window.location.port || '5173'
      setNetworkInfo({
        local_ip: host,
        frontend_port: port,
        backend_port: 8000,
        upload_url: `http://${host}:${port}/?mode=drop`
      })
    }
  }

  const fetchFiles = async (silent = false) => {
    if (!silent) setLoadingFiles(true)
    try {
      const res = await axios.get('/api/drop/files')
      setFiles(res.data)
    } catch (err) {
      if (!silent) console.error('Lỗi khi tải danh sách tệp:', err)
    } finally {
      if (!silent) setLoadingFiles(false)
    }
  }

  // Generate dynamic QR code URL
  const qrTargetUrl = networkInfo.upload_url || `http://${window.location.hostname}:${window.location.port || 5173}/?mode=drop`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrTargetUrl)}&bgcolor=0f172a&color=38bdf8&margin=10`

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
      if (file.type.startsWith('image/')) {
        return { name: file.name, url: URL.createObjectURL(file), isImage: true, size: file.size }
      }
      return { name: file.name, url: null, isImage: false, size: file.size, type: file.type }
    })
    setMobilePreviews(newPreviews)
  }

  // Upload files from Mobile
  const handleMobileUpload = async () => {
    if (selectedMobileFiles.length === 0) return
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      selectedMobileFiles.forEach(file => {
        formData.append('files', file)
      })

      const res = await axios.post('/api/drop/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        }
      })

      setUploadSuccessMsg(`Đã bắn thành công ${selectedMobileFiles.length} tệp lên máy tính qua Wi-Fi!`)
      setSelectedMobileFiles([])
      setMobilePreviews([])
      if (mobileInputRef.current) mobileInputRef.current.value = ''
      fetchFiles()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi truyền tệp qua Wi-Fi')
    } finally {
      setUploading(false)
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
      await axios.post('/api/drop/upload', formData)
      fetchFiles()
      if (pcInputRef.current) pcInputRef.current.value = ''
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi tải tệp lên')
    } finally {
      setPcUploading(false)
    }
  }

  // Delete single file
  const confirmDeleteFile = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`/api/drop/files/${deleteTarget.filename}`)
      setDeleteTarget(null)
      fetchFiles()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi xóa tệp')
    } finally {
      setDeleting(false)
    }
  }

  // Clear all files
  const confirmClearAll = async () => {
    setDeleting(true)
    try {
      await axios.delete('/api/drop/clear')
      setShowClearModal(false)
      fetchFiles()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi dọn dẹp')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered files
  const filteredFiles = files.filter(f => {
    if (fileFilter === 'all') return true
    return f.file_type === fileFilter
  })

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>Cổng Truyền Dữ Liệu Wi-Fi Cục Bộ (Không Cần Internet)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <span>WiFi Drop & Kết Nối Mobile</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Quét mã QR bằng camera điện thoại để mở kho ảnh và bắn tức thì hàng chục ảnh/video sang máy tính với tốc độ mạng Wi-Fi cực đại!
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

              {/* QR Image with glow frame */}
              <div className="p-3.5 bg-slate-950 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 mb-4 transition-transform group-hover:scale-105 duration-300">
                <img
                  src={qrImageUrl}
                  alt="QR Code Bắn Ảnh"
                  className="w-52 h-52 rounded-2xl object-contain"
                />
              </div>

              <div className="font-extrabold text-base text-white mb-1 flex items-center gap-2">
                <span>Quét Bằng Camera Điện Thoại</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                Mở Camera iPhone hoặc Zalo/Google Lens trên Android quét mã này ➔ Chọn ảnh từ Album và bắn sang máy tính ngay lập tức!
              </p>

              {/* Real URL box */}
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 flex items-center gap-2 text-xs font-mono">
                <span className="flex-1 truncate text-blue-300 select-all">{qrTargetUrl}</span>
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
                    Muốn gửi tệp từ PC ngược lại cho Điện Thoại?
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
                      {files.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dữ liệu được lưu an toàn tại thư mục <code className="text-blue-400 font-mono">D:\admin\projects\StudyMediaHub\backend\wifidrop</code>
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

                {files.length > 0 && (
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
                    key={file.id}
                    className="group bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Media Preview Box */}
                    <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                      {file.file_type === 'image' ? (
                        <img
                          src={file.url}
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
                          href={file.url}
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
                <h4 className="font-bold text-sm text-slate-300">Chưa có ảnh hoặc tệp nào được bắn sang</h4>
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
                <span>Kết Nối Wi-Fi Với Máy Tính: OK</span>
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
                    Tổng: {formatBytes(selectedMobileFiles.reduce((acc, f) => acc + f.size, 0))}
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
                      ? `Đang bắn qua Wi-Fi (${uploadProgress}%)...`
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
            {files.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tệp Trên Máy Tính Có Sẵn Để Tải Về Điện Thoại:</span>
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {files.slice(0, 5).map(f => (
                    <div key={f.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {f.file_type === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-slate-300 font-medium">{f.display_name}</span>
                      </div>
                      <a
                        href={f.url}
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
              Chung Mạng Wi-Fi Cục Bộ
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điện thoại và máy tính cần kết nối cùng một mạng Wi-Fi (ở phòng trọ hoặc ở nhà). Do truyền trong mạng LAN, tốc độ truyền có thể đạt 50MB/s – 100MB/s, không tốn 1 byte 4G nào và không giới hạn dung lượng.
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
                src={previewFile.url}
                alt={previewFile.display_name}
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <a
                href={previewFile.url}
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
              Bạn có chắc chắn muốn xóa toàn bộ {files.length} tệp trong kho WiFi Drop không?
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
