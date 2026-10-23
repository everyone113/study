import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Download,
  Eye,
  Sliders,
  Maximize2,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { applyCanvasFilter } from './clientForensicsUtils'

export default function MicroTextOsint({ imageDataUrl, filename }) {
  const [activeFilter, setActiveFilter] = useState('original')
  const [enhancedUrl, setEnhancedUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const canvasRef = useRef(null)

  // Apply visual enhancement on canvas
  useEffect(() => {
    if (!imageDataUrl) return
    setIsProcessing(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      if (activeFilter !== 'original') {
        applyCanvasFilter(canvas, activeFilter)
      }

      setEnhancedUrl(canvas.toDataURL('image/png'))
      setIsProcessing(false)
    }
    img.src = imageDataUrl
  }, [imageDataUrl, activeFilter])

  // Copy full image to clipboard as PNG blob for instant Ctrl+V into OSINT engines
  const handleCopyImageToClipboard = async () => {
    const targetUrl = enhancedUrl || imageDataUrl
    if (!targetUrl) return

    try {
      const res = await fetch(targetUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ])
      setCopySuccess(true)
      setToastMessage('Đã sao chép ảnh vào Clipboard! Bạn có thể nhấn Ctrl + V trực tiếp trên Google Lens, Yandex hoặc Bing.')
      setTimeout(() => {
        setCopySuccess(false)
        setToastMessage(null)
      }, 5000)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
      // Fallback: Copy data URL as text
      try {
        await navigator.clipboard.writeText(targetUrl)
        setToastMessage('Đã sao chép Base64 data URL vào Clipboard.')
        setTimeout(() => setToastMessage(null), 3000)
      } catch (e) {
        alert('Không thể sao chép ảnh vào clipboard tự động. Vui lòng tải ảnh về máy.')
      }
    }
  }

  // Download filtered image
  const handleDownloadEnhanced = () => {
    if (!enhancedUrl) return
    const a = document.createElement('a')
    a.href = enhancedUrl
    a.download = `enhanced_${activeFilter}_${filename || 'forensic.png'}`
    a.click()
  }

  const FILTERS = [
    {
      id: 'original',
      name: 'Ảnh Gốc',
      desc: 'Màu sắc và độ tương phản tự nhiên của ảnh.'
    },
    {
      id: 'contrast',
      name: 'Tương Phản Cực Đại',
      desc: 'Kéo dãn dải tương phản động để làm nổi bật các nét chữ in mờ, tem nhãn.'
    },
    {
      id: 'otsu',
      name: 'Nhị Phân Hóa Otsu (B&W)',
      desc: 'Phân ngưỡng thích nghi đen/trắng, triệt tiêu phản xạ lóa đèn trên biển số xe và hóa đơn.'
    },
    {
      id: 'laplacian',
      name: 'Phát Hiện Cạnh (Laplacian)',
      desc: 'Lọc đạo hàm bậc 2 làm nổi bật đường bao chữ số và các vết cào xước vi mô.'
    },
    {
      id: 'invert',
      name: 'Âm Bản (Negative)',
      desc: 'Đảo ngược sắc độ giúp mắt người nhận dạng chữ in trắng trên nền tối thuận lợi hơn.'
    }
  ]

  const OSINT_ENGINES = [
    {
      name: 'Google Lens',
      url: 'https://lens.google.com/',
      badge: 'Thực Thể & Chữ Vi Mô',
      color: 'hover:border-blue-500/50 bg-blue-500/5',
      desc: 'Tìm kiếm ảnh chụp tương tự, tra cứu thương hiệu, nhận diện thực thể và đọc OCR chữ tiếng Việt mạnh mẽ nhất.'
    },
    {
      name: 'Yandex Visual Search',
      url: 'https://yandex.com/images/search?rpt=imageview',
      badge: 'Khuôn Mặt & Phong Cảnh',
      color: 'hover:border-red-500/50 bg-red-500/5',
      desc: 'Công cụ đối chiếu góc chụp phong cảnh thực tế và nhận diện đối tượng không bị ảnh hưởng bởi cắt cúp.'
    },
    {
      name: 'Bing Visual Search',
      url: 'https://www.bing.com/visualsearch',
      badge: 'Thương Mại & Sản Phẩm',
      color: 'hover:border-teal-500/50 bg-teal-500/5',
      desc: 'Truy vết nguồn gốc website, phân loại biển hiệu cửa hàng và hàng hóa từ chỉ mục Bing toàn cầu.'
    },
    {
      name: 'TinEye Reverse Search',
      url: 'https://tineye.com/',
      badge: 'Truy Vết Bản Sửa Đổi',
      color: 'hover:border-amber-500/50 bg-amber-500/5',
      desc: 'Chuyên truy tìm ngày đầu tiên bức ảnh xuất hiện trên Internet và các phiên bản đã qua cắt ghép/rescale.'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-xs font-semibold flex items-center justify-between shadow-2xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 1. Micro-Text Visual Enhancement Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tăng Cường Thị Giác Nhận Dạng Chữ Vi Mô (Micro-Text)</h3>
              <p className="text-xs text-slate-400">Bộ lọc quang học đọc biển số xe mờ, hóa đơn, số serial và tem kiểm định</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImageToClipboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copySuccess ? 'Đã sao chép ảnh!' : 'Sao chép ảnh vào Clipboard'}</span>
            </button>
            <button
              onClick={handleDownloadEnhanced}
              title="Tải ảnh đã qua xử lý về máy"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className={`font-bold text-xs mb-1 ${isActive ? 'text-purple-300' : 'text-slate-200'}`}>
                  {f.name}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {f.desc}
                </div>
              </button>
            )
          })}
        </div>

        {/* Enhanced Visual Display Canvas */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-96 flex items-center justify-center p-3 relative">
          {isProcessing ? (
            <div className="text-center text-xs text-purple-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <span>Đang áp dụng bộ lọc xử lý hình ảnh...</span>
            </div>
          ) : enhancedUrl ? (
            <img
              src={enhancedUrl}
              alt="Enhanced Micro-text preview"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <div className="text-slate-500 text-xs">Chưa có ảnh</div>
          )}

          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-xs text-purple-300 font-mono">
            Chế độ: {FILTERS.find(f => f.id === activeFilter)?.name}
          </div>
        </div>
      </div>

      {/* 2. OSINT 1-Click Reverse Image Search Shortcuts */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Truy Vết Nguồn Gốc Ảnh (Reverse Image Search OSINT)</h3>
              <p className="text-xs text-slate-400">1-chạm mở các công cụ tìm kiếm ảnh ngược hàng đầu thế giới</p>
            </div>
          </div>
        </div>

        {/* Workflow Guidance Box */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-blue-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Quy trình truy vết OSINT nhanh bằng Clipboard:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li>
              Bấm nút <strong className="text-cyan-300">"Sao chép ảnh vào Clipboard"</strong> ở trên để đưa ảnh vào bộ nhớ tạm của hệ thống.
            </li>
            <li>
              Chọn và mở một trong các công cụ tìm kiếm bên dưới trong tab mới.
            </li>
            <li>
              Trên trang tìm kiếm, chỉ cần nhấn tổ hợp phím <strong className="text-cyan-300 font-mono">Ctrl + V</strong> (hoặc bấm vào biểu tượng máy ảnh dán ảnh) để bắt đầu quét toàn mạng!
            </li>
          </ol>
        </div>

        {/* Search Engine Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OSINT_ENGINES.map((engine) => (
            <div
              key={engine.name}
              className={`p-4 rounded-xl border border-slate-800/80 transition-all flex flex-col justify-between ${engine.color}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{engine.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {engine.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {engine.desc}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <a
                  href={engine.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mở {engine.name}</span>
                </a>
                <button
                  onClick={handleCopyImageToClipboard}
                  title="Sao chép ảnh trước khi chuyển trang"
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
