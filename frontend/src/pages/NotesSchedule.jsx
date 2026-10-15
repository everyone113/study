import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CalendarCheck,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  Tag,
  BookOpen,
  X,
  Filter
} from 'lucide-react'

export default function NotesSchedule() {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filterSubject, setFilterSubject] = useState('')
  const [filterCompleted, setFilterCompleted] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject_id: '',
    remind_at: '',
    deadline: '',
    priority: 'normal',
    tag: 'Bài tập'
  })

  useEffect(() => {
    fetchNotes()
    fetchSubjects()
  }, [filterSubject, filterCompleted])

  const fetchNotes = async () => {
    try {
      const params = {}
      if (filterSubject) params.subject_id = filterSubject
      if (filterCompleted !== '') params.is_completed = filterCompleted
      const res = await axios.get('/api/notes', { params })
      setNotes(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/subjects')
      setSubjects(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateNote = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...newNote,
        subject_id: newNote.subject_id ? parseInt(newNote.subject_id) : null,
        remind_at: newNote.remind_at || null,
        deadline: newNote.deadline || null
      }
      await axios.post('/api/notes', payload)
      setShowAddModal(false)
      setNewNote({
        title: '',
        content: '',
        subject_id: '',
        remind_at: '',
        deadline: '',
        priority: 'normal',
        tag: 'Bài tập'
      })
      fetchNotes()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi tạo ghi chú')
    }
  }

  const handleToggle = async (id) => {
    try {
      await axios.put(`/api/notes/${id}/toggle`)
      fetchNotes()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Xóa ghi chú này?')) {
      await axios.delete(`/api/notes/${id}`)
      fetchNotes()
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-400" />
            Sổ Ghi Chú & Lịch Trình Môn Học
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi chú bài học, đặt ngày giờ hẹn nhắc nhở và quản lý deadline đồ án
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ghi Chú / Deadline</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Lọc theo:</span>
        </div>

        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">Tất cả môn học</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>

        <select
          value={filterCompleted}
          onChange={e => setFilterCompleted(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="0">Đang chờ xử lý</option>
          <option value="1">Đã hoàn thành</option>
        </select>
      </div>

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => {
          const isDone = note.is_completed === 1
          return (
            <div
              key={note.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      note.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {note.tag || 'Note'}
                    </span>
                    {note.subject_name && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        • {note.subject_name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className={`font-bold text-base text-white mb-1.5 ${isDone ? 'line-through text-slate-400' : ''}`}>
                  {note.title}
                </h3>
                {note.content && (
                  <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed mb-3">
                    {note.content}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                {note.remind_at && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Nhắc nhở: {note.remind_at.replace('T', ' ')}</span>
                  </div>
                )}
                {note.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Hạn chót: {note.deadline.replace('T', ' ')}</span>
                  </div>
                )}

                <button
                  onClick={() => handleToggle(note.id)}
                  className={`w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isDone
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>{isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn tất'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Add Note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Thêm Ghi Chú & Lịch Học</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Môn học liên quan</label>
                <select
                  value={newNote.subject_id}
                  onChange={e => setNewNote({ ...newNote, subject_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
                >
                  <option value="">(Không gắn môn - Ghi chú chung)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tiêu đề ghi chú / nhiệm vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nộp bài tập lớn Java Swing"
                  value={newNote.title}
                  onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Nội dung cần nhớ, link tham khảo, ghi chú giảng viên dặn..."
                  value={newNote.content}
                  onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày giờ nhắc nhở</label>
                  <input
                    type="datetime-local"
                    value={newNote.remind_at}
                    onChange={e => setNewNote({ ...newNote, remind_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn chót (Deadline)</label>
                  <input
                    type="datetime-local"
                    value={newNote.deadline}
                    onChange={e => setNewNote({ ...newNote, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={newNote.priority}
                    onChange={e => setNewNote({ ...newNote, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="high">Quan trọng / Gấp</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phân loại (Tag)</label>
                  <select
                    value={newNote.tag}
                    onChange={e => setNewNote({ ...newNote, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="Bài tập">Bài tập</option>
                    <option value="Thi cử">Thi cử</option>
                    <option value="Đồ án">Đồ án</option>
                    <option value="Lịch học">Lịch học</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Lưu Ghi Chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
