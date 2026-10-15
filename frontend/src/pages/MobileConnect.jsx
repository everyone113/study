import React, { useState, useEffect } from 'react'
import {
  QrCode,
  Smartphone,
  Wifi,
  Globe,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop
} from 'lucide-react'

export default function MobileConnect() {
  const [copied, setCopied] = useState(false)
  const currentHost = window.location.hostname
  const port = window.location.port || '5173'
  const localUrl = `http://${currentHost === 'localhost' || currentHost === '127.0.0.1' ? '192.168.1.x' : currentHost}:${port}`
  
  // Use public QR service API to generate clean QR image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(localUrl)}&bgcolor=0f172a&color=38bdf8&margin=10`

  const handleCopy = () => {
    navigator.clipboard.writeText(localUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            Đa Nền Tảng: PC & Điện Thoại
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Kết Nối Ứng Dụng Với Điện Thoại Di Động
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Sử dụng điện thoại để xem lịch học, xem điểm, tải video hoặc điều khiển công cụ từ xa mà không cần ngồi trước máy tính.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Laptop className="w-6 h-6" />
          </div>
          <span className="text-slate-600 font-bold">⇄</span>
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QR Code Connect Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: QR Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-700/80 shadow-inner mb-4">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48 rounded-xl object-contain"
            />
          </div>

          <div className="text-sm font-bold text-white mb-1">
            Quét mã QR bằng Camera Điện Thoại
          </div>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            Mở Camera trên iPhone hoặc Zalo/Google Lens trên Android để mở trang ngay
          </p>

          {/* Local URL copy box */}
          <div className="flex items-center gap-2 w-full max-w-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300">
            <span className="flex-1 truncate">{localUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-800 text-blue-400"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right: Step-by-Step Instructions */}
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                Kết Nối Cùng Mạng Wi-Fi
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-10">
              Đảm bảo máy tính và điện thoại của bạn đang bắt cùng một mạng Wi-Fi tại nhà hoặc phòng trọ.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Thêm Vào Màn Hình Chính (PWA App)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-10">
              Trên trình duyệt Safari (iOS) bấm <strong>Chia sẻ ➔ Thêm vào MH chính</strong>. Trên Chrome (Android) bấm <strong>Cài đặt ứng dụng</strong>. Biểu tượng StudyMediaHub sẽ xuất hiện trên điện thoại y như app tải từ App Store.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Ra Ngoài Dùng 4G (Tùy Chọn)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-10">
              Nếu bạn muốn ra khỏi nhà vẫn dùng điện thoại 4G truy cập về máy tính ở nhà, bạn có thể chạy Cloudflare Tunnel miễn phí (chỉ cần chạy lệnh <code className="text-blue-400 font-mono">cloudflared tunnel --url http://localhost:5173</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
