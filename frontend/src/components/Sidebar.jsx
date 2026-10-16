import React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  CalendarCheck,
  FileDown,
  Terminal,
  Video,
  Sparkles,
  QrCode,
  Layers,
  HeartPulse,
  Flame,
  Layout
} from 'lucide-react'

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: Layers,
    badge: null,
    category: 'study',
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400',
    activeBg: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/30'
  },
  {
    id: 'academic',
    label: 'Môn & Điểm số',
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
    icon: HeartPulse,
    badge: 'Y Khoa',
    category: 'study',
    color: 'text-rose-400',
    iconBg: 'bg-rose-500/10 group-hover:bg-rose-500/20 text-rose-400',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    activeBg: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
  },
  {
    id: 'documents',
    label: 'Kho & Tải tài liệu',
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
    icon: Terminal,
    badge: 'Java/C++',
    category: 'study',
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
  },
  {
    id: 'uikit',
    label: 'Kho Giao Diện',
    icon: Layout,
    badge: 'UI Kit',
    category: 'media',
    color: 'text-fuchsia-400',
    iconBg: 'bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 text-fuchsia-400',
    badgeStyle: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
    activeBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-600/30'
  },
  {
    id: 'animation',
    label: 'Animation Studio',
    icon: Flame,
    badge: '60 FPS',
    category: 'media',
    color: 'text-orange-400',
    iconBg: 'bg-orange-500/10 group-hover:bg-orange-500/20 text-orange-400',
    badgeStyle: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    activeBg: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30'
  },
  {
    id: 'media',
    label: 'Xưởng Media',
    icon: Video,
    badge: 'Anti-Dup',
    category: 'media',
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
  },
  {
    id: 'smart',
    label: 'Tiện ích AI',
    icon: Sparkles,
    badge: 'Live Sub',
    category: 'media',
    color: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20 text-yellow-400',
    badgeStyle: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    activeBg: 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg shadow-yellow-600/30'
  },
  {
    id: 'mobile',
    label: 'WiFi Drop & Mobile',
    icon: QrCode,
    badge: 'Bắn ảnh',
    category: 'media',
    color: 'text-teal-400',
    iconBg: 'bg-teal-500/10 group-hover:bg-teal-500/20 text-teal-400',
    badgeStyle: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    activeBg: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/30'
  },
]

export default function Sidebar({ currentTab, setCurrentTab }) {
  const studyItems = NAV_ITEMS.filter(i => i.category === 'study')
  const mediaItems = NAV_ITEMS.filter(i => i.category === 'media')

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800/80 p-4 h-screen sticky top-0 backdrop-blur-xl">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-3 py-3 mb-5 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent border border-blue-500/20 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
            StudyMedia<span className="text-blue-400">Hub</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Personal Workstation</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Học tập, Y khoa & Code
        </div>
        {studyItems.map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                isActive
                  ? item.activeBg
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-white/20 text-white shadow-sm' : item.iconBg
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={isActive ? 'font-bold' : 'group-hover:text-white'}>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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

        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-5 mb-2">
          Media & Tiện ích
        </div>
        {mediaItems.map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                isActive
                  ? item.activeBg
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-white/20 text-white shadow-sm' : item.iconBg
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={isActive ? 'font-bold' : 'group-hover:text-white'}>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ổ D: Ready
        </span>
        <span className="text-[10px] font-mono text-slate-500">v1.1.0</span>
      </div>
    </aside>
  )
}
