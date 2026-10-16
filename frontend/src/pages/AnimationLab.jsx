import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { animate } from 'animejs'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Move,
  Layers,
  Activity,
  Flame,
  Zap,
  Eye,
  Radio,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react'

// Tech stack items for Infinite Marquee
const TECH_MARQUEE = [
  { name: 'Framer Motion', tag: 'Physics & React', color: 'from-pink-500 to-rose-500' },
  { name: 'GSAP 3', tag: 'Cinematic Timelines', color: 'from-emerald-400 to-green-600' },
  { name: 'Anime.js v4', tag: 'SVG & Kinematics', color: 'from-amber-400 to-orange-500' },
  { name: 'Tailwind CSS', tag: 'GPU 120 FPS', color: 'from-cyan-400 to-blue-600' },
  { name: 'Canvas Confetti', tag: 'Celebration FX', color: 'from-purple-400 to-indigo-500' },
  { name: 'SVG Path Draw', tag: 'Vector Morphing', color: 'from-violet-400 to-fuchsia-600' },
  { name: 'Glassmorphism', tag: 'Modern Apple UI', color: 'from-blue-400 to-teal-400' },
  { name: 'Bento Grid', tag: 'Stagger Reveal', color: 'from-yellow-400 to-amber-600' },
]

export default function AnimationLab() {
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'framer' | 'gsap' | 'anime' | 'css'
  const [selectedCode, setSelectedCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [staggerKey, setStaggerKey] = useState(0)

  // Framer Motion 3D tilt card state
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  // GSAP Counter & Timeline states
  const counterRef = useRef(null)
  const [gsapCount, setGsapCount] = useState(0)
  const gsapTimelineRef = useRef(null)
  const [timelineStatus, setTimelineStatus] = useState('Sẵn sàng')

  // Anime.js SVG path ref & dots
  const svgPathRef = useRef(null)
  const animeDotsRef = useRef(null)

  // 1. Trigger Confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  // 2. GSAP Number Counter Demo
  const runGsapCounter = () => {
    const obj = { val: 0 }
    gsap.to(obj, {
      val: 3950,
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => {
        setGsapCount(Math.floor(obj.val))
      }
    })
  }

  // 3. GSAP Orchestrated Timeline Demo
  const playGsapTimeline = () => {
    setTimelineStatus('Đang chạy kịch bản...')
    const tl = gsap.timeline({
      onComplete: () => {
        setTimelineStatus('Hoàn thành!')
        triggerConfetti()
      }
    })
    tl.to('#tl-box-1', { scale: 1.25, rotate: 90, duration: 0.5, ease: 'back.out(2)' })
      .to('#tl-box-2', { x: 40, backgroundColor: '#8b5cf6', duration: 0.4 }, '-=0.2')
      .to('#tl-box-3', { scaleY: 1.5, duration: 0.4, ease: 'power2.out' })
      .to('#tl-progress', { width: '100%', duration: 0.6, ease: 'power1.inOut' })
      .to('#tl-box-1, #tl-box-2, #tl-box-3', { scale: 1, rotate: 0, x: 0, duration: 0.4, delay: 0.2 })
  }

  const resetGsapTimeline = () => {
    gsap.set('#tl-box-1, #tl-box-2, #tl-box-3', { scale: 1, rotate: 0, x: 0, backgroundColor: '' })
    gsap.set('#tl-progress', { width: '0%' })
    setTimelineStatus('Sẵn sàng')
  }

  // 4. Anime.js SVG Path Animation
  const runAnimeSvg = () => {
    if (svgPathRef.current) {
      animate(svgPathRef.current, {
        strokeDashoffset: [400, 0],
        duration: 2000,
        ease: 'inOutSine'
      })
    }
  }

  // 5. Anime.js Dots Wave
  const runAnimeWave = () => {
    const dots = document.querySelectorAll('.anime-dot')
    if (dots.length > 0) {
      dots.forEach((dot, idx) => {
        animate(dot, {
          translateY: [
            { value: -20, duration: 400, ease: 'outQuad', delay: idx * 60 },
            { value: 0, duration: 500, ease: 'outBounce', delay: idx * 60 + 200 }
          ],
          scale: [
            { value: 1.3, duration: 400, delay: idx * 60 },
            { value: 1, duration: 500, delay: idx * 60 + 200 }
          ]
        })
      })
    }
  }

  useEffect(() => {
    runGsapCounter()
    runAnimeSvg()
  }, [])

  // Handle 3D Tilt calculation
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setTilt({
      x: (y / rect.height) * -20,
      y: (x / rect.width) * 20
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categories = [
    { id: 'all', label: 'Tất Cả Hiệu Ứng', count: 12 },
    { id: 'framer', label: 'Framer Motion', count: 3 },
    { id: 'gsap', label: 'GSAP 3 Motion', count: 3 },
    { id: 'anime', label: 'Anime.js v4', count: 3 },
    { id: 'css', label: 'Pure CSS / Tailwind', count: 3 },
  ]

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner with Aurora background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 p-6 md:p-8 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Chuyển Động Đỉnh Cao • 60-120 FPS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Phòng Thí Nghiệm Animation & Motion FX
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Tập hợp đầy đủ các công nghệ chuyển động web hiện đại: <strong>Framer Motion</strong> (mô phỏng vật lý), <strong>GSAP</strong> (chuỗi kịch bản điện ảnh), <strong>Anime.js</strong> (vẽ nét SVG), và <strong>Pure CSS / Tailwind</strong> (nhẹ, tối ưu phần cứng).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerConfetti}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Bắn Pháo Hoa (Confetti)</span>
            </button>
          </div>
        </div>

        {/* Infinite Seamless Marquee of Animation Technologies */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 overflow-hidden">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
            <span>Công nghệ tích hợp sẵn (Hover để tạm dừng băng chuyền):</span>
          </p>
          <div className="relative w-full overflow-hidden mask-fade-edges">
            <div className="animate-marquee flex gap-4">
              {[...TECH_MARQUEE, ...TECH_MARQUEE].map((tech, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-sm whitespace-nowrap"
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${tech.color}`} />
                  <span className="text-xs font-bold text-white">{tech.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({tech.tag})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs with Framer Motion Pill */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. FRAMER MOTION SHOWCASE                                                 */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'framer') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">1. Framer Motion (Vật Lý & Cử Chỉ Gestures)</h2>
                <p className="text-xs text-slate-400">Hiệu ứng chuyển động mô phỏng lò xo (Spring Physics) và cử chỉ chuột</p>
              </div>
            </div>
            <button
              onClick={() => setStaggerKey(k => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chạy lại Bento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Demo 1: 3D Tilt Card on Mouse Hover */}
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ rotateX: tilt.x, rotateY: tilt.y }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-700/80 shadow-2xl flex flex-col justify-between h-72 cursor-pointer group"
            >
              <div className="space-y-2" style={{ transform: 'translateZ(30px)' }}>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300">
                    Hover 3D Tilt
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCode({
                        title: 'Framer Motion: 3D Tilt Card',
                        code: `<motion.div\n  onMouseMove={handleMouseMove}\n  onMouseLeave={handleMouseLeave}\n  animate={{ rotateX: tilt.x, rotateY: tilt.y }}\n  transition={{ type: 'spring', stiffness: 300, damping: 20 }}\n  style={{ transformStyle: 'preserve-3d' }}\n>\n  <div style={{ transform: 'translateZ(30px)' }}>\n    <h3>3D Tilt Card</h3>\n  </div>\n</motion.div>`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                    title="Xem mã nguồn"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                  Thẻ Tương Tác Nghiêng 3D
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rê chuột vào bất kỳ góc nào của thẻ để cảm nhận độ nghiêng 3D thực tế theo tọa độ con trỏ và hồi vị tự nhiên nhờ Spring Physics.
                </p>
              </div>

              <div
                style={{ transform: 'translateZ(40px)' }}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="text-slate-400 font-mono">Tọa độ góc quay:</span>
                <span className="font-mono text-pink-400 font-bold">
                  X: {tilt.x.toFixed(1)}° | Y: {tilt.y.toFixed(1)}°
                </span>
              </div>
            </motion.div>

            {/* Demo 2: Drag & Drop Elastic Spring */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between h-72">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                    Kéo Thả (Drag & Snap)
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'Framer Motion: Drag & Snapback',
                        code: `<motion.div\n  drag\n  dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}\n  dragElastic={0.2}\n  whileHover={{ scale: 1.1 }}\n  whileTap={{ scale: 0.95 }}\n  transition={{ type: 'spring', stiffness: 500, damping: 20 }}\n>\n  <span>Kéo tôi đi!</span>\n</motion.div>`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">Vật Thể Đàn Hồi Cầm Nắm</h3>
                <p className="text-xs text-slate-400">
                  Dùng chuột kéo khối ngọc tím ra khỏi tâm. Khi thả tay, khối sẽ nảy búng trở lại vị trí gốc như gắn dây chun.
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                  Khu vực đàn hồi
                </div>
                <motion.div
                  drag
                  dragConstraints={{ left: -45, right: 45, top: -40, bottom: 40 }}
                  dragElastic={0.25}
                  whileHover={{ scale: 1.1, cursor: 'grab' }}
                  whileTap={{ scale: 0.95, cursor: 'grabbing' }}
                  className="absolute w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-600/40 select-none z-10"
                >
                  <Move className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Kéo tôi!</span>
                </motion.div>
              </div>
            </div>

            {/* Demo 3: Staggered Bento Grid Mini Entrance */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between h-72">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                    Bento Staggered
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'Framer Motion: Staggered Children',
                        code: `const container = {\n  hidden: { opacity: 0 },\n  show: {\n    opacity: 1,\n    transition: { staggerChildren: 0.08 }\n  }\n}\nconst item = {\n  hidden: { opacity: 0, scale: 0.8, y: 15 },\n  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 18 } }\n}`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">Xuất Hiện So Le (Stagger)</h3>
                <p className="text-xs text-slate-400">
                  Từng ô lưới bung ra tuần tự với hiệu ứng lò xo mượt mà, giúp trang không bị cứng đơ.
                </p>
              </div>

              <motion.div
                key={staggerKey}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-2.5 mt-2"
              >
                {[
                  { title: 'Tốc độ', val: '120 FPS', bg: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
                  { title: 'Vật lý', val: 'Spring', bg: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
                  { title: 'Gestures', val: 'Drag/Tap', bg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                  { title: 'Morphing', val: 'LayoutId', bg: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 12 },
                      show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 20 } }
                    }}
                    className={`p-3 rounded-2xl border ${item.bg} flex flex-col justify-center`}
                  >
                    <span className="text-[10px] font-semibold opacity-75">{item.title}</span>
                    <span className="text-xs font-bold">{item.val}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. GSAP 3 MOTION & KINETIC TIMELINES                                      */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'gsap') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2. GSAP 3 (GreenSock Timeline & Orchestration)</h2>
              <p className="text-xs text-slate-400">Kịch bản điện ảnh chuẩn công nghiệp: Chuỗi sự kiện đa giai đoạn và bộ đếm mượt mà</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Demo 1: GSAP Timeline Sequencer */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                      GSAP Timeline
                    </span>
                    <span className="text-xs text-slate-400">Trạng thái: <strong className="text-emerald-400">{timelineStatus}</strong></span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Chuỗi Hoạt Ảnh Phối Hợp</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playGsapTimeline}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Chạy Kịch Bản</span>
                  </button>
                  <button
                    onClick={resetGsapTimeline}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Đặt lại"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'GSAP 3: Timeline Orchestration',
                        code: `import gsap from 'gsap'\n\nconst tl = gsap.timeline()\ntl.to('#box1', { scale: 1.25, rotate: 90, duration: 0.5, ease: 'back.out(2)' })\n  .to('#box2', { x: 40, duration: 0.4 }, '-=0.2')\n  .to('#progress', { width: '100%', duration: 0.6, ease: 'power1.inOut' })`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animation Stage */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between h-40">
                <div className="flex items-center justify-around">
                  <div
                    id="tl-box-1"
                    className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-lg shadow-emerald-500/20"
                  >
                    B1
                  </div>
                  <div
                    id="tl-box-2"
                    className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-lg shadow-blue-600/20"
                  >
                    B2
                  </div>
                  <div
                    id="tl-box-3"
                    className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-lg shadow-amber-500/20"
                  >
                    B3
                  </div>
                </div>

                {/* Progress bar controlled by GSAP */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Thanh nạp năng lượng Timeline:</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div id="tl-progress" className="w-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Demo 2: GSAP Number Counter & Easing */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                    GSAP Number Easing
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Bộ Đếm Tăng Tốc Điện Tử</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runGsapCounter}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đếm lại</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'GSAP 3: Numeric Easing Counter',
                        code: `const obj = { val: 0 }\ngsap.to(obj, {\n  val: 3950,\n  duration: 2.2,\n  ease: 'power3.out',\n  onUpdate: () => setScore(Math.floor(obj.val))\n})`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-around h-40">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold font-mono text-cyan-400 tracking-tight">
                    {gsapCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Điểm kinh nghiệm tích lũy (EXP)</p>
                </div>
                <div className="h-16 w-px bg-slate-800" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">
                    {((gsapCount / 3950) * 3.92).toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">GPA Quy đổi (Hệ 4.0)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. ANIME.JS V4 & SVG MAGIC                                                */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'anime') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">3. Anime.js v4 (Vẽ Nét SVG & Sóng Hạt)</h2>
              <p className="text-xs text-slate-400">Chuyên trị các hiệu ứng vẽ viền vector, quỹ đạo quay hạt nhân và sóng so le</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Demo 1: SVG Path Drawing */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300">
                    Anime.js SVG Path
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Tự Vẽ Nét Bút Vector</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runAnimeSvg}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Vẽ Lại</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'Anime.js v4: SVG Path Drawing',
                        code: `import { animate } from 'animejs'\n\nanimate(pathElement, {\n  strokeDashoffset: [400, 0],\n  duration: 2000,\n  ease: 'inOutSine'\n})`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center h-44">
                <svg className="w-64 h-32" viewBox="0 0 260 120" fill="none">
                  {/* Subtle shadow guide path */}
                  <path
                    d="M 20 60 C 60 10, 100 110, 140 60 C 180 10, 220 110, 240 60"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Animated path */}
                  <path
                    ref={svgPathRef}
                    d="M 20 60 C 60 10, 100 110, 140 60 C 180 10, 220 110, 240 60"
                    stroke="url(#gradient-svg)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="400"
                    strokeDashoffset="0"
                  />
                  <defs>
                    <linearGradient id="gradient-svg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Demo 2: Anime.js Wave Staggered Dots */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300">
                    Anime.js Kinetic Wave
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Sóng Hạt Nảy Nhịp Điệu</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runAnimeWave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold shadow-lg shadow-orange-500/30 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Tạo Sóng</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'Anime.js v4: Kinetic Dot Wave',
                        code: `import { animate } from 'animejs'\n\ndots.forEach((dot, idx) => {\n  animate(dot, {\n    translateY: [\n      { value: -20, duration: 400, ease: 'outQuad', delay: idx * 60 },\n      { value: 0, duration: 500, ease: 'outBounce', delay: idx * 60 + 200 }\n    ]\n  })\n})`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center gap-3 h-44">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="anime-dot w-4 h-12 rounded-full bg-gradient-to-b from-orange-400 via-amber-500 to-yellow-300 shadow-md shadow-orange-500/30"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. PURE CSS & TAILWIND (ZERO JS DEPENDENCY, 60-120 FPS)                     */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'css') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">4. Pure CSS & Tailwind (Không Tốn CPU / GPU 120 FPS)</h2>
              <p className="text-xs text-slate-400">Các hiệu ứng thẩm mỹ đỉnh cao không cần JavaScript, tải trang là chạy ngay</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Demo 1: Glow Border Card */}
            <div className="relative group p-0.5 rounded-3xl overflow-hidden shadow-2xl">
              {/* Spinning Rainbow Glow Background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-md animate-spin-slow" />

              <div className="relative bg-slate-900 p-6 rounded-[22px] flex flex-col justify-between h-64 border border-slate-800/60">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                      CSS Glow Border
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCode({
                          title: 'Tailwind CSS: Glow Rainbow Border',
                          code: `<div className="relative group p-0.5 rounded-3xl overflow-hidden">\n  {/* Rainbow Glow Layer */}\n  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 opacity-60 group-hover:opacity-100 blur-md animate-spin-slow" />\n  {/* Content Layer */}\n  <div className="relative bg-slate-900 p-6 rounded-[22px]">\n    <h3>Thẻ Phát Sáng 360°</h3>\n  </div>\n</div>`
                        })
                      }}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    Hào Quang Xoay Viền 360°
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Đường viền gradient đa sắc liên tục xoay tròn mượt mà, khi rê chuột vào thì ánh sáng bùng nổ mạnh mẽ hơn.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
                  <span>Hover để tăng độ sáng</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Demo 2: Shimmer Skeleton Glass Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between h-64">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300">
                    CSS Shimmer
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'CSS: Shimmer Light Sweep',
                        code: `@keyframes shimmer {\n  0% { transform: translateX(-100%); }\n  100% { transform: translateX(100%); }\n}\n\n.shimmer-box {\n  position: relative;\n  overflow: hidden;\n}\n.shimmer-box::after {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);\n  animation: shimmer 2s infinite;\n}`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">Vệt Sáng Ánh Kim (Shimmer)</h3>
                <p className="text-xs text-slate-400">
                  Dùng trong hiệu ứng Skeleton Loading hoặc làm nổi bật các thẻ quan trọng như VIP, Điểm số, Thông báo khẩn.
                </p>
              </div>

              {/* Shimmer element */}
              <div className="relative overflow-hidden p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                <div className="space-y-2 relative z-10">
                  <div className="w-3/4 h-3 rounded bg-slate-800" />
                  <div className="w-1/2 h-2.5 rounded bg-slate-800/60" />
                </div>
              </div>
            </div>

            {/* Demo 3: Floating Ambient Orb */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between h-64">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                    CSS Float & Pulse
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCode({
                        title: 'CSS: Floating Levitation',
                        code: `@keyframes float {\n  0%, 100% { transform: translateY(0px); }\n  50% { transform: translateY(-10px); }\n}\n.animate-float {\n  animation: float 4s ease-in-out infinite;\n}`
                      })
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">Lơ Lửng Không Trọng Lực</h3>
                <p className="text-xs text-slate-400">
                  Hiệu ứng nhấp nhô nhẹ nhàng tựa như trôi dạt trong không gian, mang lại cảm giác thư thái cho người học.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="animate-float px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>StudyMediaHub Floating Badge</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CODE VIEW MODAL                                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedCode.title}</h3>
                    <p className="text-xs text-slate-400">Mã nguồn sẵn dùng, copy vào dự án</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {/* Code display */}
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 border border-slate-800/80">
                  {selectedCode.code}
                </pre>
                <button
                  onClick={() => handleCopyCode(selectedCode.code)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
