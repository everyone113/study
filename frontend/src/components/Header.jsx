import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Wifi,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react'

export default function Header({ currentTab, setCurrentTab }) {
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
    documents: 'Kho Tài Liệu & Tải File Trực Tuyến',
    code: 'Phòng Lập Trình & Ôn Code (Java, C++, Python)',
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
