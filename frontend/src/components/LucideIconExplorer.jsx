import React, { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import {
  Search,
  Sliders,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Code2,
  Info,
  Maximize2,
  Play
} from 'lucide-react'

// Selected curated list of popular Lucide icons across multiple domains
const ICON_ENTRIES = [
  // Navigation & Core
  { name: 'Home', cat: 'Navigation' },
  { name: 'Search', cat: 'Navigation' },
  { name: 'Menu', cat: 'Navigation' },
  { name: 'Grid', cat: 'Navigation' },
  { name: 'Layers', cat: 'Navigation' },
  { name: 'Compass', cat: 'Navigation' },

  // Study & Academic
  { name: 'GraduationCap', cat: 'Học tập' },
  { name: 'BookOpen', cat: 'Học tập' },
  { name: 'Award', cat: 'Học tập' },
  { name: 'CalendarCheck', cat: 'Học tập' },
  { name: 'FileText', cat: 'Học tập' },
  { name: 'Brain', cat: 'Học tập' },
  { name: 'Library', cat: 'Học tập' },

  // Code & Tech
  { name: 'Terminal', cat: 'Lập trình' },
  { name: 'Code2', cat: 'Lập trình' },
  { name: 'Cpu', cat: 'Lập trình' },
  { name: 'GitBranch', cat: 'Lập trình' },
  { name: 'Database', cat: 'Lập trình' },
  { name: 'ShieldCheck', cat: 'Lập trình' },

  // Media & Design
  { name: 'Video', cat: 'Media' },
  { name: 'Flame', cat: 'Media' },
  { name: 'Sparkles', cat: 'Media' },
  { name: 'Palette', cat: 'Media' },
  { name: 'Camera', cat: 'Media' },
  { name: 'Music', cat: 'Media' },
  { name: 'Film', cat: 'Media' },

  // Mobile & Connectivity
  { name: 'Smartphone', cat: 'Kết nối' },
  { name: 'QrCode', cat: 'Kết nối' },
  { name: 'Wifi', cat: 'Kết nối' },
  { name: 'Cast', cat: 'Kết nối' },
  { name: 'Share2', cat: 'Kết nối' },
  { name: 'Radio', cat: 'Kết nối' },

  // Medical & Health
  { name: 'HeartPulse', cat: 'Y khoa' },
  { name: 'Activity', cat: 'Y khoa' },
  { name: 'Stethoscope', cat: 'Y khoa' },
  { name: 'Cross', cat: 'Y khoa' },
  { name: 'Pill', cat: 'Y khoa' },

  // System & Status
  { name: 'Settings', cat: 'Hệ thống' },
  { name: 'Bell', cat: 'Hệ thống' },
  { name: 'Clock', cat: 'Hệ thống' },
  { name: 'CheckCircle2', cat: 'Hệ thống' },
  { name: 'Zap', cat: 'Hệ thống' },
  { name: 'Star', cat: 'Hệ thống' }
]

const COLOR_OPTIONS = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pure White', hex: '#ffffff' },
]

export default function LucideIconExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')
  const [iconSize, setIconSize] = useState(28)
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [iconColor, setIconColor] = useState('#38bdf8')
  const [activeIcon, setActiveIcon] = useState(ICON_ENTRIES[0])
  const [copiedType, setCopiedType] = useState(null)
  const [spinActive, setSpinActive] = useState(false)

  const categories = ['all', 'Học tập', 'Lập trình', 'Media', 'Kết nối', 'Y khoa', 'Hệ thống', 'Navigation']

  const filteredIcons = ICON_ENTRIES.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.cat.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCat === 'all' || item.cat === selectedCat
    return matchesSearch && matchesCat
  })

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const ActiveComponent = LucideIcons[activeIcon.name] || LucideIcons.Sparkles

  const reactCodeSnippet = `import { ${activeIcon.name} } from 'lucide-react'

<${activeIcon.name}
  size={${iconSize}}
  strokeWidth={${strokeWidth}}
  color="${iconColor}"${spinActive ? '\n  className="animate-spin"' : ''}
/>`

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg md:text-xl text-white tracking-tight">
                Lucide Icons Studio • Trình Tra Cứu & Tùy Biến Biểu Tượng
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                lucide-icons/lucide
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống 1000+ biểu tượng vector hiện đại, tinh gọn với hỗ trợ live preview và 1-click copy code
            </p>
          </div>
        </div>

        <a
          href="https://lucide.dev/icons"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
        >
          <span>lucide.dev</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Studio Area: Left = Grid, Right = Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search & Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar & filter pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm icon (Terminal, Flame, HeartPulse, GraduationCap...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  selectedCat === c
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c === 'all' ? 'Tất cả' : c}
              </button>
            ))}
          </div>

          {/* Icon Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredIcons.map((item) => {
              const Comp = LucideIcons[item.name] || LucideIcons.Sparkles
              const isSelected = activeIcon.name === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveIcon(item)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <Comp
                    size={24}
                    strokeWidth={isSelected ? strokeWidth : 2}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isSelected ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 group-hover:text-white font-mono truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Col: Inspector & Customizer */}
        <div className="space-y-4 bg-slate-950/70 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem thử thời gian thực</span>
              <span className="text-xs font-mono font-bold text-rose-400">{activeIcon.name}</span>
            </div>

            {/* Live Preview Box */}
            <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div
                className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ backgroundColor: iconColor }}
              />
              <ActiveComponent
                size={iconSize}
                strokeWidth={strokeWidth}
                color={iconColor}
                className={spinActive ? 'animate-spin' : ''}
              />
            </div>

            {/* Customization Sliders */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Kích thước (Size):</span>
                  <span className="font-mono text-rose-400">{iconSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="56"
                  value={iconSize}
                  onChange={(e) => setIconSize(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Độ dày nét (Stroke):</span>
                  <span className="font-mono text-rose-400">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Color swatches */}
              <div>
                <span className="text-xs text-slate-300 block mb-1.5">Màu sắc (Color):</span>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setIconColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        iconColor === c.hex ? 'scale-110 border-white shadow-sm' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0 ml-1"
                  />
                </div>
              </div>

              {/* Spin toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300">Hiệu ứng quay (Spin):</span>
                <button
                  onClick={() => setSpinActive(!spinActive)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    spinActive ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {spinActive ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => copyToClipboard(reactCodeSnippet, 'jsx')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
            >
              {copiedType === 'jsx' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã sao chép JSX!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép React JSX</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
