import React from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  GraduationCap,
  CalendarCheck,
  HeartPulse,
  FileDown,
  Terminal,
  Layout,
  Flame,
  Video,
  Sparkles,
  QrCode,
  Network
} from 'lucide-react'

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    shortLabel: 'Tổng Quan',
    description: 'Bảng theo dõi GPA, tiến độ & câu nói triết học',
    icon: Home,
    badge: null,
    category: 'study',
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400',
    activeBg: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/35 rounded-2xl'
  },
  {
    id: 'academic',
    label: 'Môn & Điểm số',
    shortLabel: 'Điểm GPA',
    description: 'Quản lý tín chỉ, điểm thành phần & GPA hệ 4.0',
    icon: GraduationCap,
    badge: null,
    category: 'study',
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
  },
  {
    id: 'notes',
    label: 'Ghi chú & Lịch',
    shortLabel: 'Lịch Trình',
    description: 'Ghi chú học tập, nhắc nhở & đếm ngược deadline',
    icon: CalendarCheck,
    badge: null,
    category: 'study',
    color: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400',
    activeBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30'
  },
  {
    id: 'anatomy',
    label: 'Giải phẫu 3D',
    shortLabel: 'Giải Phẫu',
    description: 'Mô hình 3D tim, não, nội tạng & cơ xương Svitylo',
    icon: HeartPulse,
    badge: 'YKhoa',
    category: 'study',
    color: 'text-rose-400',
    iconBg: 'bg-rose-500/10 group-hover:bg-rose-500/20 text-rose-400',
    badgeStyle: 'bg-rose-950/80 text-rose-300 border border-rose-800/60',
    activeBg: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
  },
  {
    id: 'documents',
    label: 'Kho & Tải tài liệu',
    shortLabel: 'Tài Liệu',
    description: 'Tải tài liệu PDF, DOCX, slide môn học & lưu cục bộ',
    icon: FileDown,
    badge: null,
    category: 'study',
    color: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400',
    activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
  },
  {
    id: 'code',
    label: 'Phòng Code',
    shortLabel: 'Phòng Code',
    description: 'Biên dịch Java 21, C++, Python trực tiếp trên máy',
    icon: Terminal,
    badge: 'Java/C++',
    category: 'study',
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400',
    badgeStyle: 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
    activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
  },
  {
    id: 'mindmap',
    label: 'Xưởng Sơ Đồ Tư Duy',
    shortLabel: 'Sơ Đồ Tư Duy',
    description: 'AI Mindmap Studio, Infinite Canvas & Âm thanh Focus',
    icon: Network,
    badge: 'Mới',
    category: 'study',
    color: 'text-violet-400',
    iconBg: 'bg-violet-500/10 group-hover:bg-violet-500/20 text-violet-400',
    badgeStyle: 'bg-violet-950/80 text-violet-300 border border-violet-800/60',
    activeBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/35 rounded-2xl'
  },
  {
    id: 'uikit',
    label: 'Kho Giao Diện',
    shortLabel: 'UI Kit',
    description: '50+ mẫu component web Dark Mode & Apple UI',
    icon: Layout,
    badge: 'UI Kit',
    category: 'media',
    color: 'text-fuchsia-400',
    iconBg: 'bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 text-fuchsia-400',
    badgeStyle: 'bg-purple-950/80 text-purple-300 border border-purple-800/60',
    activeBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-600/30'
  },
  {
    id: 'animation',
    label: 'Animation Studio',
    shortLabel: 'Animation',
    description: 'Phòng thí nghiệm Framer Motion, GSAP, Anime.js',
    icon: Flame,
    badge: '60 FPS',
    category: 'media',
    color: 'text-orange-400',
    iconBg: 'bg-orange-500/10 group-hover:bg-orange-500/20 text-orange-400',
    badgeStyle: 'bg-orange-950/80 text-orange-300 border border-orange-800/60',
    activeBg: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30'
  },
  {
    id: 'media',
    label: 'Xưởng Media',
    shortLabel: 'Xưởng Media',
    description: 'Xử lý video, hình ảnh & thuật toán chống trùng lặp',
    icon: Video,
    badge: 'Anti-Dup',
    category: 'media',
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400',
    badgeStyle: 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60',
    activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
  },
  {
    id: 'smart',
    label: 'Tiện ích AI',
    shortLabel: 'Tiện Ích AI',
    description: 'Dịch phụ đề trực tiếp, TTS giọng đọc & Flashcards',
    icon: Sparkles,
    badge: 'Live Sub',
    category: 'media',
    color: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20 text-yellow-400',
    badgeStyle: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
    activeBg: 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg shadow-yellow-600/30'
  },
  {
    id: 'mobile',
    label: 'WiFi Drop & Mobile',
    shortLabel: 'WiFi Drop',
    description: 'Bắn ảnh, video không dây giữa điện thoại & PC',
    icon: QrCode,
    badge: 'Bắn ảnh',
    category: 'media',
    color: 'text-teal-400',
    iconBg: 'bg-teal-500/10 group-hover:bg-teal-500/20 text-teal-400',
    badgeStyle: 'bg-teal-950/80 text-teal-300 border border-teal-800/60',
    activeBg: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/30'
  },
]

export default function Sidebar({ currentTab, setCurrentTab }) {
  const studyItems = NAV_ITEMS.filter(i => i.category === 'study')
  const mediaItems = NAV_ITEMS.filter(i => i.category === 'media')

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800/80 p-4 h-screen sticky top-0 backdrop-blur-xl">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1">
            StudyMedia <span className="text-blue-400 font-semibold">Hub</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Personal Workstation</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {studyItems.map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm transition-all cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-[0_4px_20px_rgba(37,99,235,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                <span className={isActive ? 'font-bold text-white' : 'font-medium group-hover:text-white'}>
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : item.badgeStyle || 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          )
        })}

        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
          MEDIA & TIỆN ÍCH
        </div>
        {mediaItems.map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm transition-all cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-[0_4px_20px_rgba(37,99,235,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                <span className={isActive ? 'font-bold text-white' : 'font-medium group-hover:text-white'}>
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : item.badgeStyle || 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800/80 px-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>Đã sẵn sàng</span>
        </span>
        <span className="text-xs font-mono text-slate-500">v1.1.0</span>
      </div>
    </aside>
  )
}
