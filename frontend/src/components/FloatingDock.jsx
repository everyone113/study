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
  ChevronUp
} from 'lucide-react'

// All dock items with categories, clear feature names, tags and vibrant color accents
export const DOCK_ITEMS = [
  { id: 'dashboard', label: 'Bảng Điều Khiển', badge: 'Tổng quan', icon: Layers, color: 'text-sky-400', group: 'study' },
  { id: 'academic', label: 'Môn Học & Điểm GPA', badge: 'Học tập', icon: GraduationCap, color: 'text-emerald-400', group: 'study' },
  { id: 'notes', label: 'Ghi Chú & Lịch Trình', badge: 'Lịch thi', icon: CalendarCheck, color: 'text-indigo-400', group: 'study' },
  { id: 'anatomy', label: 'Atlas Giải Phẫu 3D', badge: 'Y Khoa', icon: HeartPulse, color: 'text-rose-400', group: 'study' },
  { id: 'documents', label: 'Kho & Tải Tài Liệu', badge: 'Tài liệu', icon: FileDown, color: 'text-cyan-400', group: 'study' },
  { id: 'code', label: 'Phòng Code Java/C++', badge: 'Dev IDE', icon: Terminal, color: 'text-amber-400', group: 'study' },
  { id: 'uikit', label: 'Kho Giao Diện Web', badge: '50+ Mẫu', icon: Layout, color: 'text-fuchsia-400', group: 'tools' },
  { id: 'animation', label: 'Animation & Motion FX', badge: 'FX Studio', icon: Flame, color: 'text-orange-400', group: 'tools' },
  { id: 'media', label: 'Xưởng Sáng Tạo Media', badge: 'Video/Audio', icon: Video, color: 'text-purple-400', group: 'tools' },
  { id: 'smart', label: 'Tiện Ích AI Thông Minh', badge: 'AI Tool', icon: Sparkles, color: 'text-yellow-400', group: 'tools' },
  { id: 'mobile', label: 'WiFi Drop Bắn File', badge: 'P2P QR', icon: QrCode, color: 'text-teal-400', group: 'tools' },
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

  // 1. Spring Magnification physics: scales width & height from 48px to 70px on hover
  const sizeSync = useTransform(distance, [-140, 0, 140], [48, 70, 48])
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 280, damping: 18 })

  // 2. Spring Vertical Lift physics: lifts the hovered icon up by up to 14px
  const ySync = useTransform(distance, [-140, 0, 140], [0, -14, 0])
  const y = useSpring(ySync, { mass: 0.1, stiffness: 280, damping: 18 })

  // 3. Icon size scale inside button
  const iconScaleSync = useTransform(distance, [-140, 0, 140], [1, 1.25, 1])
  const iconScale = useSpring(iconScaleSync, { mass: 0.1, stiffness: 300, damping: 20 })

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
      style={{ width: size, height: size, y }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.88, y: 2 }}
      transition={{ type: 'spring', stiffness: 450, damping: 16 }}
      className={`relative flex items-center justify-center rounded-2xl cursor-pointer select-none group transition-all duration-200 ${
        hovered ? 'z-40' : 'z-10'
      } ${
        isActive
          ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.75)] ring-1 ring-blue-400/50'
          : 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
      }`}
    >
      {/* Icon with Spring Bounce when selected */}
      <motion.div
        style={{ scale: iconScale }}
        animate={justClicked ? { scale: [1, 1.35, 0.9, 1], rotate: [0, -8, 8, 0] } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
        className="shrink-0 flex items-center justify-center pointer-events-none"
      >
        <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-white' : item.color}`} />
      </motion.div>

      {/* Active Indicator reflection glow under icon */}
      {isActive && (
        <motion.span
          layoutId="activeDockDot"
          className="absolute -bottom-2 w-8 h-1 rounded-full bg-blue-400/80 blur-[2px] shadow-[0_0_12px_#38bdf8]"
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        />
      )}

      {/* Apple-style floating tooltip with Spring physics - Positioned ABOVE dock, zero clipping, z-50 */}
      <AnimatePresence>
        {hovered && (
          <div className="absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 24 }}
              className="flex flex-col items-center"
            >
              {/* Tooltip Card */}
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/90 backdrop-blur-2xl text-white shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex items-center gap-2 whitespace-nowrap ring-1 ring-white/10">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold tracking-tight">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/25 text-blue-300 border border-blue-400/30">
                    {item.badge}
                  </span>
                )}
              </div>
              {/* Downward Arrow Pointer */}
              <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/90 rotate-45 -mt-1.5 shadow-sm" />
            </motion.div>
          </div>
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
    <div className="hidden md:block fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] overflow-visible pointer-events-auto">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0a101d]/90 border border-slate-700/60 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 select-none cursor-grab active:cursor-grabbing overflow-visible"
          >
            {/* Collapse Pill Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => setCollapsed(true)}
              title="Thu nhỏ Đảo Nổi (Spring Collapse)"
              className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer mr-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>

            {/* Dock Icons with macOS Spring Magnification physics - overflow-visible ensures tooltips are NEVER clipped */}
            <div className="flex items-center gap-1.5 overflow-visible py-0.5 px-0.5">
              {DOCK_ITEMS.map((item) => (
                <DockIcon
                  key={item.id}
                  item={item}
                  currentTab={currentTab}
                  setCurrentTab={setCurrentTab}
                  mouseX={mouseX}
                />
              ))}
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
