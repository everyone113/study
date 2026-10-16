import React from 'react'
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

export default function MobileNav({ currentTab, setCurrentTab }) {
  const quickTabs = [
    { id: 'dashboard', label: 'Home', icon: Layers, color: 'text-sky-400' },
    { id: 'academic', label: 'Điểm', icon: GraduationCap, color: 'text-emerald-400' },
    { id: 'uikit', label: 'UI Kit', icon: Layout, color: 'text-fuchsia-400' },
    { id: 'animation', label: 'FX', icon: Flame, color: 'text-orange-400' },
    { id: 'notes', label: 'Lịch', icon: CalendarCheck, color: 'text-indigo-400' },
    { id: 'anatomy', label: 'Giải phẫu', icon: HeartPulse, color: 'text-rose-400' },
    { id: 'code', label: 'Code', icon: Terminal, color: 'text-amber-400' },
    { id: 'smart', label: 'AI Tool', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'mobile', label: 'Drop', icon: QrCode, color: 'text-teal-400' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
      {quickTabs.map(tab => {
        const Icon = tab.icon
        const isActive = currentTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'scale-105 font-bold text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : tab.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
