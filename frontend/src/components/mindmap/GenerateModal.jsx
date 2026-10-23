import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  FileText,
  X,
  Loader2,
  BookOpen,
  Terminal,
  Pill,
  Check
} from 'lucide-react'
import axios from 'axios'

const SAMPLES = {
  os: {
    label: 'Hệ Điều Hành',
    icon: Terminal,
    title: 'Hệ Điều Hành Đại Cương',
    text: `# Hệ Điều Hành Đại Cương
## Quản lý Tiến trình
- Khái niệm PCB và chuyển ngữ cảnh
- Trạng thái: Ready, Running, Waiting
- Thuật toán điều độ Round Robin
## Quản lý Bộ nhớ
- Phân trang & Bảng trang
- Không gian địa chỉ logic và vật lý
- Thuật toán thay thế trang LRU
## Hệ thống Tập tin
- Cấu trúc cây thư mục
- Bảng i-node và Metadata`
  },
  pharma: {
    label: 'Dược Lý Học',
    icon: Pill,
    title: 'Dược Lý Học: Kháng Sinh',
    text: `# Dược Lý Học: Kháng Sinh
## Nhóm Beta-lactam
- Penicillin (Penicillin G đường tiêm, Amoxicillin đường uống)
- Cephalosporin (Thế hệ 1 Cefazolin, Thế hệ 3 Ceftriaxone)
## Nhóm Macrolide
- Azithromycin (Thời gian bán thải dài, ít tác dụng phụ)
- Clarithromycin (Phác đồ tiệt trừ vi khuẩn HP dạ dày)
## Nhóm Quinolone
- Ciprofloxacin (Nhiễm khuẩn tiết niệu và tiêu hóa)
- Levofloxacin (Nhiễm khuẩn hô hấp mắc phải tại cộng đồng)`
  },
  fullstack: {
    label: 'Fullstack Dev',
    icon: BookOpen,
    title: 'Fullstack Web Roadmap 2026',
    text: `# Fullstack Web Roadmap 2026
## Frontend Engineering
- React 18 & Vite (HMR siêu tốc)
- Tailwind CSS & Dark Mode Theme
- Web Audio API Procedural Synthesis
## Backend Systems
- FastAPI & Asynchronous Python 3.12
- SQLite Storage trên Drive D:
- Pydantic v2 Data Validation
## DevOps & Triển Khai
- Docker Containerization
- GitHub Actions CI/CD Pipeline`
  }
}

export default function GenerateModal({
  isOpen,
  onClose,
  onGenerated
}) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [saveToDb, setSaveToDb] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleApplySample = (sampleKey) => {
    const s = SAMPLES[sampleKey]
    if (s) {
      setTitle(s.title)
      setText(s.text)
      setError('')
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Vui lòng nhập nội dung văn bản hoặc chọn mẫu có sẵn.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/mindmap/generate', {
        text: trimmed,
        title: title.trim() || undefined,
        save: saveToDb,
        user_id: 'guest'
      })

      const data = response.data
      const generatedTree = data.root_node || data.root_data
      const finalTitle = data.title || title.trim() || (generatedTree ? generatedTree.text : 'Sơ đồ tư duy mới')

      onGenerated({
        id: data.id,
        title: finalTitle,
        root_node: generatedTree,
        saved: Boolean(data.saved)
      })

      onClose()
    } catch (err) {
      console.error('Error generating mindmap:', err)
      const detail = err.response?.data?.detail || err.message || 'Không thể tạo sơ đồ'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-white/10"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Tạo Sơ Đồ Tư Duy Tự Động
              </h3>
              <p className="text-xs text-slate-400">
                Phân tích Markdown, đề cương học tập hoặc danh sách gạch đầu dòng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {/* Quick Sample Selector */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">Gợi ý nội dung mẫu nhanh:</div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {Object.entries(SAMPLES).map(([key, item]) => {
                const Icon = item.icon
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplySample(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Tên chủ đề sơ đồ (Tùy chọn)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cấu trúc Dữ liệu & Giải thuật..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Text / Outline Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Nội dung ghi chú / Markdown Outline</span>
              <span className="text-[10px] text-slate-500 font-normal">Hỗ trợ #, ##, - gạch đầu dòng, thụt lề Tab</span>
            </label>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="# Tiêu đề chính&#10;## Nhánh 1&#10;- Ý tưởng 1.1&#10;- Ý tưởng 1.2&#10;## Nhánh 2..."
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Options: Save to DB */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="saveToDbCheckbox"
              checked={saveToDb}
              onChange={(e) => setSaveToDb(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="saveToDbCheckbox" className="text-xs text-slate-300 cursor-pointer select-none">
              Lưu ngay vào cơ sở dữ liệu SQLite sau khi sinh
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tạo Sơ Đồ Ngay (1 Click)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
