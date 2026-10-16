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
  { id: 'dashboard', label: 'Tổng quan', icon: Layers, badge: null, category: 'study' },
  { id: 'academic', label: 'Môn & Điểm số', icon: GraduationCap, badge: null, category: 'study' },
  { id: 'notes', label: 'Ghi chú & Lịch', icon: CalendarCheck, badge: null, category: 'study' },
  { id: 'anatomy', label: 'Giải phẫu 3D', icon: HeartPulse, badge: 'Y Khoa', category: 'study' },
  { id: 'documents', label: 'Kho & Tải tài liệu', icon: FileDown, badge: null, category: 'study' },
  { id: 'code', label: 'Phòng Code', icon: Terminal, badge: 'Java/C++', category: 'study' },
  { id: 'uikit', label: 'Kho Giao Diện', icon: Layout, badge: 'UI Kit', category: 'media' },
  { id: 'animation', label: 'Animation Studio', icon: Flame, badge: '60 FPS', category: 'media' },
  { id: 'media', label: 'Xưởng Media', icon: Video, badge: 'Anti-Dup', category: 'media' },
  { id: 'smart', label: 'Tiện ích AI', icon: Sparkles, badge: 'Live Sub', category: 'media' },
  { id: 'mobile', label: 'WiFi Drop & Mobile', icon: QrCode, badge: 'Bắn ảnh', category: 'media' },
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : item.id === 'anatomy' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : item.id === 'anatomy'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-blue-400 border border-blue-500/20'
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-400 border border-purple-500/20'
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
