import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { generatePresentationSequence } from '../../utils/mindmapTreeUtils'

export default function PresentationView({
  rootNode,
  isOpen,
  onClose
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoTts, setAutoTts] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const slides = React.useMemo(() => {
    return generatePresentationSequence(rootNode)
  }, [rootNode])

  // Reset to first slide when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen])

  const currentSlide = slides[currentIndex] || {
    nodeId: 'none',
    text: 'Không có dữ liệu',
    notes: '',
    breadcrumbs: '',
    color: '#6366f1',
    childCount: 0
  }

  // TTS read aloud current slide
  const speakCurrentSlide = React.useCallback(() => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const textToSpeak = `${currentSlide.text}. ${currentSlide.notes ? currentSlide.notes : ''}`
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(textToSpeak)
      ? 'vi-VN'
      : 'en-US'
    utterance.rate = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [currentSlide])

  // Trigger TTS if autoTts is on
  useEffect(() => {
    if (isOpen && autoTts) {
      speakCurrentSlide()
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentIndex, isOpen, autoTts, speakCurrentSlide])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setCurrentIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, slides.length, onClose])

  if (!isOpen) return null

  const progressPercent = slides.length > 0 ? ((currentIndex + 1) / slides.length) * 100 : 100
  const isFirst = currentIndex === 0
  const isLast = currentIndex === slides.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Progress Bar */}
      <div className="w-full h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
          style={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Top Presentation Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Play className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Chế Độ Thuyết Trình Bài Giảng</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                DFS Logic Flow
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Sử dụng phím mũi tên ← → hoặc Phím cách để chuyển tiếp
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TTS Toggle Button */}
          <button
            onClick={() => {
              setAutoTts(!autoTts)
              if (!autoTts) speakCurrentSlide()
              else window.speechSynthesis.cancel()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              autoTts
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {autoTts ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Đọc tự động (TTS)</span>
          </button>

          {/* Slide Index Counter */}
          <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono font-bold text-blue-400">
            {currentIndex + 1} / {slides.length}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Thoát trình chiếu (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Stage Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.nodeId + currentIndex}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="w-full flex flex-col items-center text-center space-y-6"
          >
            {/* Breadcrumbs Flow */}
            {currentSlide.breadcrumbs && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                {currentSlide.breadcrumbs}
              </div>
            )}

            {/* Slide Title */}
            <div className="relative">
              <h1
                style={{ color: currentSlide.color || '#f8fafc' }}
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-3xl"
              >
                {currentSlide.text}
              </h1>
              <div
                style={{ backgroundColor: currentSlide.color || '#6366f1' }}
                className="h-1.5 w-24 mx-auto rounded-full mt-4 opacity-80"
              />
            </div>

            {/* Notes / Explanation Details */}
            {currentSlide.notes ? (
              <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-sm md:text-base text-slate-300 leading-relaxed shadow-xl text-left backdrop-blur-md">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chi tiết & Diễn giải</span>
                </div>
                <div className="whitespace-pre-wrap">{currentSlide.notes}</div>
              </div>
            ) : (
              slides.length === 1 && (
                <div className="text-sm text-slate-400 max-w-md bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  Sơ đồ hiện chỉ có 1 nút. Hãy thêm các nhánh con để thuyết trình đầy đủ hơn!
                </div>
              )
            )}

            {/* Sub-branches badge */}
            {currentSlide.childCount > 0 && (
              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Nhánh này có {currentSlide.childCount} ý tưởng trực thuộc tiếp theo</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-6 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between max-w-5xl mx-auto w-full">
        {/* Prev Slide */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={isFirst}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Ý trước (←)</span>
        </button>

        {/* Read current slide aloud button */}
        <button
          onClick={speakCurrentSlide}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Đọc to slide hiện tại"
        >
          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-amber-400 animate-pulse' : ''}`} />
        </button>

        {/* Next Slide */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={isLast}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-30 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <span>Ý tiếp theo (→)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
