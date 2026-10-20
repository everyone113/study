import React, { useState, useEffect, useRef } from 'react'
import Vara from 'vara'
import {
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Sliders,
  Type,
  Palette,
  Clock,
  Layers
} from 'lucide-react'

const FONTS = [
  { id: 'satisfy', name: 'Satisfy (Thư Pháp Mềm Mại)', url: '/fonts/vara/SatisfySL.json' },
  { id: 'parisienne', name: 'Parisienne (Phong Cách Pháp Lãng Mạn)', url: '/fonts/vara/Parisienne.json' },
  { id: 'pacifico', name: 'Pacifico (Nét Bút Lông Đậm Đà)', url: '/fonts/vara/PacificoSLO.json' },
]

const COLOR_PRESETS = [
  { name: 'Neon Cyan', color: '#38bdf8' },
  { name: 'Rose Pink', color: '#f472b6' },
  { name: 'Amber Gold', color: '#fbbf24' },
  { name: 'Emerald', color: '#34d399' },
  { name: 'Pure White', color: '#f8fafc' },
  { name: 'Violet Glow', color: '#a855f7' },
]

const TEXT_PRESETS = [
  'StudyMediaHub',
  'Knowledge is Power',
  'Practice Makes Perfect',
  'Never Stop Learning',
  'Vara SVG Handwriting'
]

export default function VaraHandwriting() {
  const [text, setText] = useState('StudyMediaHub')
  const [selectedFont, setSelectedFont] = useState(FONTS[0].url)
  const [fontSize, setFontSize] = useState(36)
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [color, setColor] = useState('#38bdf8')
  const [duration, setDuration] = useState(2500)
  const [isDrawing, setIsDrawing] = useState(false)
  const [copied, setCopied] = useState(false)

  const containerRef = useRef(null)
  const varaInstanceRef = useRef(null)

  // Initialize or re-draw handwriting animation
  const drawHandwriting = () => {
    const el = containerRef.current
    if (!el) return

    // Clear previous SVG
    el.innerHTML = ''
    setIsDrawing(true)

    try {
      varaInstanceRef.current = new Vara(
        '#vara-animation-canvas',
        selectedFont,
        [
          {
            text: text || 'StudyMediaHub',
            fontSize: fontSize,
            strokeWidth: strokeWidth,
            color: color,
            duration: duration,
            textAlign: 'center'
          }
        ],
        {
          strokeWidth: strokeWidth,
          color: color,
          textAlign: 'center',
          autoAnimation: true
        }
      )

      varaInstanceRef.current.ready(() => {
        setIsDrawing(false)
      })

      varaInstanceRef.current.animationEnd(() => {
        setIsDrawing(false)
      })
    } catch (err) {
      console.warn('Vara animation error:', err)
      setIsDrawing(false)
    }
  }

  // Trigger draw on mount and when font changes
  useEffect(() => {
    drawHandwriting()
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [selectedFont])

  const handleCopyCode = () => {
    const codeSnippet = `import Vara from 'vara'

new Vara(
  '#my-element',
  '${selectedFont}',
  [
    {
      text: '${text}',
      fontSize: ${fontSize},
      strokeWidth: ${strokeWidth},
      color: '${color}',
      duration: ${duration},
      textAlign: 'center'
    }
  ],
  {
    strokeWidth: ${strokeWidth},
    color: '${color}',
    textAlign: 'center',
    autoAnimation: true
  }
)`
    navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg md:text-xl text-white tracking-tight">
                Vara.js • Xưởng Viết Chữ Nghệ Thuật SVG (Handwriting Studio)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                akzhy/Vara
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mô phỏng chuyển động nét bút viết tay chân thực theo tọa độ vector JSON Fonts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={drawHandwriting}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isDrawing ? 'Đang viết...' : 'Viết chữ (Play)'}</span>
          </button>
          <button
            onClick={drawHandwriting}
            title="Vẽ lại từ đầu"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Canvas Stage */}
      <div className="relative min-h-[160px] md:min-h-[180px] rounded-2xl bg-gradient-to-b from-[#070b14] to-[#0a101d] border border-cyan-500/20 p-6 flex flex-col items-center justify-center overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
        
        {/* Glow ambient spot */}
        <div
          className="absolute w-72 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: color }}
        />

        {/* DOM Target where Vara mounts its animated SVG */}
        <div
          id="vara-animation-canvas"
          ref={containerRef}
          className="relative z-10 w-full flex items-center justify-center select-none"
        />

        {/* Floating status pill */}
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isDrawing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span>{isDrawing ? 'Vara Drawing...' : 'SVG Vector Ready'}</span>
        </div>
      </div>

      {/* Preset Suggestions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mẫu sẵn:
        </span>
        {TEXT_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setText(p)
              setTimeout(drawHandwriting, 100)
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Input text & font */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            Nội dung chữ viết
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung chữ..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 shadow-inner"
          />

          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pt-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Kiểu chữ viết tay (JSON Font)
          </label>
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {FONTS.map(f => (
              <option key={f.id} value={f.url}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Color Palette */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            Màu mực viết tay (Ink Color)
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setColor(c.color)
                  setTimeout(drawHandwriting, 100)
                }}
                title={c.name}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  color === c.color ? 'scale-110 border-white shadow-md' : 'border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] text-slate-400">Tự chọn:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <span className="text-xs font-mono text-slate-300">{color}</span>
          </div>
        </div>

        {/* Sliders: Size, Stroke, Speed */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Cỡ chữ (Font Size)
            </span>
            <span className="font-mono text-cyan-400 text-xs">{fontSize}px</span>
          </label>
          <input
            type="range"
            min="20"
            max="60"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />

          <label className="text-xs font-bold text-slate-300 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Tốc độ viết (Duration)
            </span>
            <span className="font-mono text-amber-400 text-xs">{(duration / 1000).toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="1000"
            max="5000"
            step="250"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
