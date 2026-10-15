import React from 'react'
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileDown,
  Terminal,
  Video,
  Sparkles,
  QrCode,
  Layers,
  ChevronRight
} from 'lucide-react'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: Layers, badge: null, category: 'main' },
  { id: 'academic', label: 'Môn & Điểm số', icon: GraduationCap, badge: null, category: 'study' },
  { id: 'notes', label: 'Ghi chú & Lịch', icon: CalendarCheck, badge: null, category: 'study' },
  { id: 'documents', label: 'Kho & Tải tài liệu', icon: FileDown, badge: null, category: 'study' },
  { id: 'code', label: 'Phòng Code', icon: Terminal, badge: 'Java/C++', category: 'code' },
  { id: 'media', label: 'Xưởng Media', icon: Video, badge: 'Anti-Dup', category: 'media' },
  { id: 'smart', label: 'Tiện ích AI', icon: Sparkles, badge: 'Live Sub', category: 'tools' },
  { id: 'mobile', label: 'Kết nối Mobile', icon: QrCode, badge: 'Wi-Fi/4G', category: 'system' },
]

export default function Sidebar({ currentTab, setCurrentTab }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800/80 p-4 h-screen sticky top-0 backdrop-blur-xl">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-3 py-3 mb-6 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent border border-blue-500/20 rounded-2xl">
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
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Học tập & Lập trình
        </div>
        {NAV_ITEMS.slice(0, 5).map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-400 border border-blue-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
          Media & Tiện ích
        </div>
        {NAV_ITEMS.slice(5).map(item => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
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
            </button>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800/80 px-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ổ D: Ready
        </span>
        <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
      </div>
    </aside>
  )
}
