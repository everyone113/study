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
  Move
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
  const [justClicked, setJustClicked] = useState(false)

  // Distance from mouse to center of this icon
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  // 1. Spring Magnification physics (smooth scaling from 44px to 68px)
  const widthSync = useTransform(distance, [-140, 0, 140], [44, 68, 44])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 280, damping: 18 })

  // 2. Spring Vertical Lift physics (icon lifts upward by up to 12px on hover)
  const ySync = useTransform(distance, [-140, 0, 140], [0, -12, 0])
  const y = useSpring(ySync, { mass: 0.1, stiffness: 280, damping: 18 })

  const Icon = item.icon
  const isActive = currentTab === item.id

  const handleClick = () => {
    setJustClicked(true)
    setCurrentTab(item.id)
    setTimeout(() => setJustClicked(false), 500)
  }

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width, y }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.88, y: 2 }}
      transition={{ type: 'spring', stiffness: 450, damping: 16 }}
      className={`relative flex items-center justify-center rounded-2xl cursor-pointer select-none group transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/60'
          : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white'
      }`}
    >
      {/* Icon with Spring Bounce when selected */}
      <motion.div
        animate={justClicked ? { scale: [1, 1.35, 0.9, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      >
        <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : item.color}`} />
      </motion.div>

      {/* Active Indicator Dot under icon with glowing spring */}
      {isActive && (
        <motion.span
          layoutId="activeDockDot"
          className="absolute -bottom-2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 shadow-[0_0_12px_#38bdf8]"
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        />
      )}

      {/* Apple-style floating tooltip with Spring physics */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: -52, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            className="absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/90 backdrop-blur-2xl text-white text-[11px] font-bold whitespace-nowrap shadow-2xl pointer-events-none z-50 flex items-center gap-1.5"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-slate-500'}`} />
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
            drag
            dragConstraints={{ left: -50, right: 50, top: -25, bottom: 25 }}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 22 }}
            whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
            initial={{ opacity: 0, y: 40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, mass: 0.8 }}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex items-center gap-2 px-3.5 py-3 rounded-3xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 select-none cursor-grab active:cursor-grabbing"
          >
            {/* Collapse Pill Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => setCollapsed(true)}
              title="Thu nhỏ Đảo Nổi (Spring Collapse)"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer mr-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>

            {/* Dock Icons with macOS Spring Magnification physics */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
              {DOCK_ITEMS.map((item, idx) => {
                if (item.isDivider) {
                  return (
                    <div
                      key={`div-${idx}`}
                      className="w-px h-7 bg-slate-800/80 shrink-0 mx-1"
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
          /* Mini Dynamic Island Mode with Elastic Spring */
          <motion.button
            drag
            dragConstraints={{ left: -30, right: 30, top: -15, bottom: 15 }}
            dragElastic={0.25}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/90 border border-slate-700/90 backdrop-blur-2xl shadow-2xl text-white text-xs font-bold cursor-pointer ring-1 ring-blue-500/30"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/40"
            >
              <ActiveIcon className="w-3.5 h-3.5" />
            </motion.div>
            <span>{activeItem.label}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
