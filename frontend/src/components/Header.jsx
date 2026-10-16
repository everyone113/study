import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Wifi,
  Clock,
  Sparkles,
  ExternalLink,
  Compass
} from 'lucide-react'

export default function Header({ currentTab, setCurrentTab, showDock, setShowDock }) {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const titles = {
    dashboard: 'Bảng Điều Khiển Tổng Quan',
    academic: 'Quản Lý Môn Học & Tính Điểm GPA',
    notes: 'Ghi Chú, Lịch Trình & Deadline',
    anatomy: 'Atlas Giải Phẫu Học 3D • Y Khoa (Svitylo 3D)',
    documents: 'Kho Tài Liệu & Tải File Trực Tuyến',
    code: 'Phòng Lập Trình & Ôn Code (Java, C++, Python)',
    uikit: 'Kho Thư Viện Giao Diện Web & UI Kit Studio (Tailwind CSS & React)',
    animation: 'Phòng Thí Nghiệm Animation & Motion FX (GSAP, Framer Motion, Anime.js, CSS)',
    media: 'Xưởng Sáng Tạo Media & Lách Quét Trùng Lặp',
    smart: 'Tiện Ích AI (Dịch Sub Realtime, TTS, Flashcard)',
    mobile: 'Kết Nối Đa Thiết Bị (PC & Điện Thoại)'
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
          {titles[currentTab] || 'StudyMediaHub'}
        </h2>
        <p className="text-xs text-slate-400 hidden sm:block">
          Trạm điều hành học tập & công cụ cá nhân trên ổ D
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Floating Dock Toggle Button */}
        {setShowDock && (
          <button
            onClick={() => setShowDock(prev => !prev)}
            title="Bật/Tắt thanh điều hướng Đảo Nổi (Floating Dock)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showDock
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${showDock ? 'animate-spin-slow' : ''}`} />
            <span className="hidden sm:inline">Đảo Nổi</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showDock ? 'bg-blue-400' : 'bg-slate-600'}`} />
          </button>
        )}

        {/* Real-time Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{timeStr}</span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>FastAPI Online</span>
        </div>
      </div>
    </header>
  )
}
