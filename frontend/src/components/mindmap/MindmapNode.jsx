import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Palette,
  FileText,
  CornerDownRight,
  Edit2,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { PALETTE } from '../../utils/mindmapTreeUtils'

export default function MindmapNode({
  node,
  isSelected,
  onSelect,
  onAddChild,
  onAddSibling,
  onDelete,
  onRename,
  onUpdateNotes,
  onUpdateColor,
  onToggleCollapse
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(node.text || '')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notesText, setNotesText] = useState(node.notes || '')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const inputRef = useRef(null)
  const isRoot = node.id === 'node-root' || node.level === 0

  useEffect(() => {
    setEditText(node.text || '')
    setNotesText(node.notes || '')
  }, [node.text, node.notes])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = (e) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleFinishEdit = () => {
    setIsEditing(false)
    const trimmed = editText.trim()
    if (trimmed !== node.text) {
      onRename(node.id, trimmed || 'Nhánh mới')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFinishEdit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(node.text || '')
    }
  }

  // Text-To-Speech (Web Speech API)
  const handleSpeak = (e) => {
    e.stopPropagation()
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const content = `${node.text}. ${node.notes ? 'Ghi chú: ' + node.notes : ''}`
    const utterance = new SpeechSynthesisUtterance(content)

    // Detect language or fallback
    utterance.lang = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(content)
      ? 'vi-VN'
      : 'en-US'
    utterance.rate = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleSaveNotes = (e) => {
    e.stopPropagation()
    setShowNotesModal(false)
    onUpdateNotes(node.id, notesText)
  }

  const nodeColor = node.color || '#6366f1'
  const hasChildren = (node.children && node.children.length > 0) || node.hiddenCount > 0
  const isCollapsed = Boolean(node.isCollapsed)

  return (
    <div
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        minHeight: `${node.height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      onDoubleClick={handleStartEdit}
      className={`group select-none rounded-xl transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-400 shadow-[0_8px_24px_rgba(59,130,246,0.35)]'
          : 'hover:shadow-lg'
      }`}
    >
      {/* Node Main Card */}
      <div
        style={{
          borderLeftColor: nodeColor,
          borderLeftWidth: isRoot ? '6px' : '4px',
        }}
        className={`relative flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md transition-colors ${
          isRoot
            ? 'bg-gradient-to-r from-slate-900 to-slate-850'
            : 'bg-slate-900/90'
        }`}
      >
        {/* Node Content */}
        <div className="flex-1 min-w-0 pr-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none font-semibold"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold tracking-tight truncate ${
                  isRoot ? 'text-white text-sm font-bold' : 'text-slate-100'
                }`}
                title={node.text}
              >
                {node.text}
              </span>
              {node.notes && (
                <span
                  title={node.notes}
                  className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0"
                />
              )}
            </div>
          )}
        </div>

        {/* Hover Quick Action Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 shadow-md shrink-0"
        >
          {/* TTS Speaker */}
          <button
            onClick={handleSpeak}
            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
              isSpeaking ? 'text-amber-400 animate-pulse' : 'text-slate-400 hover:text-white'
            }`}
            title="Đọc to nội dung (TTS)"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Add Child (+) */}
          <button
            onClick={() => onAddChild(node.id)}
            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Thêm nhánh con (+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Add Sibling (Enter) */}
          {!isRoot && (
            <button
              onClick={() => onAddSibling(node.id)}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Thêm nhánh cùng cấp"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Color Picker */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 rounded text-slate-400 hover:text-fuchsia-400 hover:bg-slate-800 transition-colors relative"
            title="Đổi màu sắc nhánh"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {/* Notes Modal */}
          <button
            onClick={() => setShowNotesModal(true)}
            className={`p-1 rounded transition-colors ${
              node.notes
                ? 'text-amber-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Ghi chú chi tiết"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          {/* Delete Node (Forbidden on Root) */}
          {!isRoot && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Xóa nhánh này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapse / Expand Toggle Badge on Right Anchor */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(node.id)
            }}
            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all cursor-pointer z-10 ${
              isCollapsed
                ? 'bg-blue-600 text-white border-2 border-slate-900 ring-2 ring-blue-500/40 hover:scale-110'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
            title={isCollapsed ? `Mở rộng ${node.hiddenCount || (node.children || []).length} nhánh con` : 'Thu gọn các nhánh con'}
          >
            {isCollapsed ? `+${node.hiddenCount || (node.children || []).length}` : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Floating Color Palette Picker */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 z-50 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-xl flex items-center gap-1.5"
          >
            {PALETTE.map((color) => (
              <button
                key={color}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onUpdateColor(node.id, color)
                  setShowColorPicker(false)
                }}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-125 ${
                  node.color === color ? 'ring-2 ring-white scale-110' : ''
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Popover Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 z-50 w-72 p-3 rounded-2xl bg-slate-900/98 border border-slate-700 shadow-2xl backdrop-blur-xl text-slate-100 space-y-2 ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Ghi chú cho: {node.text}</span>
              </span>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Nhập tài liệu tham khảo, định nghĩa flashcard hoặc giải thích chi tiết..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
              >
                Lưu ghi chú
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
