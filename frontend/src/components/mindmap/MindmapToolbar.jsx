import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Volume2,
  Play,
  Download,
  Plus,
  Layers,
  FileText,
  FileCode,
  Image,
  FolderOpen,
  Check,
  AlertCircle
} from 'lucide-react'

export default function MindmapToolbar({
  title,
  onRenameTitle,
  saveStatus,
  onSave,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAutoLayout,
  onNewMindmap,
  onOpenGenerateModal,
  onToggleSoundscape,
  isSoundscapeActive,
  onStartPresentation,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportFlashcards,
  mindmapsList = [],
  onSelectMindmap,
  currentMindmapId
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)

  const handleTitleSubmit = () => {
    setIsEditingTitle(false)
    const trimmed = titleInput.trim()
    if (trimmed && trimmed !== title) {
      onRenameTitle(trimmed)
    } else {
      setTitleInput(title)
    }
  }

  return (
    <div className="relative z-30 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Left: Mindmap Title & Selector */}
      <div className="flex items-center gap-3">
        {/* Mindmaps Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowListMenu(!showListMenu)
              setShowExportMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold cursor-pointer transition-colors"
            title="Danh sách sơ đồ tư duy"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="max-w-[120px] truncate">Sơ đồ ({mindmapsList.length})</span>
          </button>

          <AnimatePresence>
            {showListMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-72 overflow-y-auto"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Sơ đồ đã lưu
                </div>
                {mindmapsList.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMindmap(m.id)
                      setShowListMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      m.id === currentMindmapId
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">{m.node_count || 1} nút</span>
                  </button>
                ))}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onNewMindmap()
                      setShowListMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-blue-400 hover:bg-slate-800 font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo sơ đồ mới</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title Editing */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="px-3 py-1 rounded-xl bg-slate-950 border border-blue-500 text-sm font-bold text-white focus:outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(title)
              setIsEditingTitle(true)
            }}
            className="text-sm font-bold text-white hover:text-blue-400 flex items-center gap-1.5 group cursor-pointer"
            title="Nhấp để đổi tên sơ đồ"
          >
            <span>{title}</span>
            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
          </button>
        )}

        {/* Save Status Badge */}
        <div className="flex items-center gap-1 text-[11px]">
          {saveStatus === 'saving' && (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Đang lưu...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Lỗi lưu</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle: Canvas Controls (Zoom, Reset, Layout) */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Căn giữa góc nhìn (Reset View)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onAutoLayout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          title="Tự động sắp xếp nhánh (Auto Layout)"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Actions (Generate, Soundscape, Presentation, Export, Save) */}
      <div className="flex items-center gap-2">
        {/* Open AI Text-to-Mindmap Generator */}
        <button
          onClick={onOpenGenerateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Tạo từ văn bản</span>
        </button>

        {/* Toggle Soundscape Player */}
        <button
          onClick={onToggleSoundscape}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isSoundscapeActive
              ? 'bg-violet-600/30 border-violet-500/50 text-violet-300 shadow-md shadow-violet-500/20 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
          }`}
          title="Bộ hòa âm không gian tập trung"
        >
          <Volume2 className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Âm thanh Focus</span>
        </button>

        {/* Start Presentation Mode */}
        <button
          onClick={onStartPresentation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold transition-all cursor-pointer"
          title="Chế độ thuyết trình tuần tự"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span className="hidden sm:inline">Thuyết trình</span>
        </button>

        {/* Export Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowExportMenu(!showExportMenu)
              setShowListMenu(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Xuất file</span>
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Định dạng xuất
                </div>
                <button
                  onClick={() => {
                    onExportPng()
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Image className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Ảnh PNG chất lượng cao</div>
                    <div className="text-[10px] text-slate-400">Độ phân giải Retina 2x sắc nét</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportSvg()
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Vector SVG sắc nét</div>
                    <div className="text-[10px] text-slate-400">Mở trong Figma, Illustrator</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportJson()
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">File JSON sao lưu</div>
                    <div className="text-[10px] text-slate-400">Sao lưu & phục hồi dữ liệu</div>
                  </div>
                </button>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onExportFlashcards()
                      setShowExportMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer bg-gradient-to-r from-violet-950/40 to-indigo-950/40"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Sang Flashcards</span>
                        <span className="text-[9px] px-1 rounded bg-yellow-500/20 text-yellow-300 font-bold">Vault</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Ôn tập ngắt quãng Spaced Repetition</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual Save Button */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          title="Lưu thủ công vào cơ sở dữ liệu"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Lưu</span>
        </button>
      </div>
    </div>
  )
}
