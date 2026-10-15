import React from 'react'
import {
  GraduationCap,
  CalendarCheck,
  FileDown,
  Terminal,
  Video,
  Sparkles,
  QrCode,
  Layers
} from 'lucide-react'

export default function MobileNav({ currentTab, setCurrentTab }) {
  const quickTabs = [
    { id: 'dashboard', label: 'Home', icon: Layers },
    { id: 'academic', label: 'Điểm', icon: GraduationCap },
    { id: 'notes', label: 'Lịch', icon: CalendarCheck },
    { id: 'code', label: 'Code', icon: Terminal },
    { id: 'media', label: 'Media', icon: Video },
    { id: 'smart', label: 'AI Tool', icon: Sparkles },
    { id: 'mobile', label: 'Kết nối', icon: QrCode },
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
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-blue-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600/20 text-blue-400' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
