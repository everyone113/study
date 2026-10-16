import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Layers,
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
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react'

// All dock items with categories and color accents
export const DOCK_ITEMS = [
  { id: 'dashboard', label: 'Tổng Quan', icon: Layers, color: 'text-blue-400', group: 'study' },
  { id: 'academic', label: 'Môn & GPA', icon: GraduationCap, color: 'text-emerald-400', group: 'study' },
  { id: 'notes', label: 'Lịch & Deadline', icon: CalendarCheck, color: 'text-indigo-400', group: 'study' },
  { id: 'anatomy', label: 'Giải Phẫu 3D', icon: HeartPulse, color: 'text-rose-400', group: 'study' },
  { id: 'documents', label: 'Kho Tài Liệu', icon: FileDown, color: 'text-cyan-400', group: 'study' },
  { id: 'code', label: 'Phòng Code', icon: Terminal, color: 'text-amber-400', group: 'study' },
  { id: 'divider', isDivider: true },
  { id: 'uikit', label: 'Kho Giao Diện', icon: Layout, color: 'text-fuchsia-400', group: 'tools' },
  { id: 'animation', label: 'Animation Studio', icon: Flame, color: 'text-orange-400', group: 'tools' },
  { id: 'media', label: 'Xưởng Media', icon: Video, color: 'text-purple-400', group: 'tools' },
  { id: 'smart', label: 'Tiện Ích AI', icon: Sparkles, color: 'text-yellow-400', group: 'tools' },
  { id: 'mobile', label: 'WiFi Drop', icon: QrCode, color: 'text-sky-400', group: 'tools' },
]

function DockIcon({ item, currentTab, setCurrentTab, mouseX }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  // Distance from mouse to center of this icon
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  // Smooth magnification scale based on mouse proximity (macOS Dock physics)
  const widthSync = useTransform(distance, [-120, 0, 120], [42, 60, 42])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 14 })

  const Icon = item.icon
  const isActive = currentTab === item.id

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setCurrentTab(item.id)}
      className={`relative flex items-center justify-center rounded-2xl transition-colors cursor-pointer select-none group ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50'
          : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : item.color}`} />

      {/* Active Indicator Dot under icon */}
      {isActive && (
        <motion.span
          layoutId="activeDockDot"
          className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-md shadow-blue-400"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Apple-style floating tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/90 backdrop-blur-xl text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl pointer-events-none z-50 flex items-center gap-1.5"
          >
            <span>{item.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default function FloatingDock({ currentTab, setCurrentTab }) {
  const [collapsed, setCollapsed] = useState(false)
  const mouseX = useMotionValue(Infinity)

  const activeItem = DOCK_ITEMS.find(i => i.id === currentTab) || DOCK_ITEMS[0]
  const ActiveIcon = activeItem.icon

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw]">
      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-3xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
          >
            {/* Collapse Pill Button */}
            <button
              onClick={() => setCollapsed(true)}
              title="Thu nhỏ Đảo Nổi"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer mr-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Dock Icons with macOS physics */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
              {DOCK_ITEMS.map((item, idx) => {
                if (item.isDivider) {
                  return (
                    <div
                      key={`div-${idx}`}
                      className="w-px h-6 bg-slate-800 shrink-0 mx-1"
                    />
                  )
                }
                return (
                  <DockIcon
                    key={item.id}
                    item={item}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    mouseX={mouseX}
                  />
                )
              })}
            </div>
          </motion.div>
        ) : (
          /* Mini Dynamic Island Mode */
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/90 border border-slate-700/90 backdrop-blur-2xl shadow-2xl hover:scale-105 transition-all text-white text-xs font-semibold cursor-pointer ring-1 ring-blue-500/30"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
            <span>{activeItem.label}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
