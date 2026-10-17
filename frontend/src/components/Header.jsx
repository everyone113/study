import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Wifi,
  Clock,
  Sparkles,
  ExternalLink,
  Compass,
  Grid,
  QrCode,
  Layers
} from 'lucide-react'
import UserMenu from './UserMenu'

export default function Header({ currentTab, setCurrentTab, showDock, setShowDock, onOpenMobileDrawer }) {
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

  const shortTitles = {
    dashboard: 'Tổng Quan',
    academic: 'Môn & Điểm',
    notes: 'Lịch & Deadline',
    anatomy: 'Giải Phẫu 3D',
    documents: 'Kho Tài Liệu',
    code: 'Phòng Code',
    uikit: 'Kho Giao Diện',
    animation: 'Animation FX',
    media: 'Xưởng Media',
    smart: 'Tiện Ích AI',
    mobile: 'WiFi Drop'
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Desktop Title */}
      <div className="hidden md:block">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
          {titles[currentTab] || 'StudyMediaHub'}
        </h2>
        <p className="text-xs text-slate-400">
          Trạm điều hành học tập & công cụ cá nhân trên ổ D
        </p>
      </div>

      {/* Mobile App Bar */}
      <div className="flex md:hidden items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{shortTitles[currentTab] || 'StudyMedia'}</span>
          </h2>
          <span className="text-[10px] text-blue-400 font-semibold">StudyMediaHub Mobile</span>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="hidden md:flex items-center gap-3">
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
            <span>Đảo Nổi</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showDock ? 'bg-blue-400' : 'bg-slate-600'}`} />
          </button>
        )}

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{timeStr}</span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>FastAPI Online</span>
        </div>

        {/* User Account & Cloud Sync Pill */}
        <UserMenu />
      </div>

      {/* Mobile Top Actions */}
      <div className="flex md:hidden items-center gap-2">
        {/* User Account / Login Button */}
        <UserMenu isMobile />

        {/* Quick WiFi Drop Button */}
        {currentTab !== 'mobile' && (
          <button
            onClick={() => setCurrentTab('mobile')}
            title="Bắn ảnh WiFi Drop"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold active:scale-95 transition-transform"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="text-[11px]">Bắn ảnh</span>
          </button>
        )}

        {/* Menu / All Tools Drawer Trigger */}
        <button
          onClick={onOpenMobileDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Grid className="w-3.5 h-3.5 text-blue-400" />
          <span>Menu</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        </button>
      </div>
    </header>
  )
}
