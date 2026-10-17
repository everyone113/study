import React, { useState, useEffect, useMemo } from 'react'
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
  Filter,
  Search,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LOCAL_STORAGE_NOTES_KEY = 'studymedia_notes'
export default function NotesSchedule() {
  const { getVaultItem, setVaultItem, currentUser, activeUserId, syncCloudData } = useAuth()

  // Load initially from active user vault with 0ms delay
  const [notes, setNotes] = useState(() => {
    return getVaultItem('notes', [])
  })

  const [subjects, setSubjects] = useState(() => {
    return getVaultItem('academic_subjects', [])
  })

  // Reload state automatically when switching user accounts
  useEffect(() => {
    const handleUserChanged = () => {
      setNotes(getVaultItem('notes', []))
      setSubjects(getVaultItem('academic_subjects', []))
    }
    window.addEventListener('studymedia:user_changed', handleUserChanged)
    return () => window.removeEventListener('studymedia:user_changed', handleUserChanged)
  }, [getVaultItem])

  const [filterSubject, setFilterSubject] = useState('')
  const [filterCompleted, setFilterCompleted] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTargetNote, setDeleteTargetNote] = useState(null)
  const [showCleanCompletedModal, setShowCleanCompletedModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/subjects')
      if (Array.isArray(res.data)) {
        setSubjects(res.data)
        try {
          localStorage.setItem(LOCAL_STORAGE_SUBJECTS_KEY, JSON.stringify(res.data))
        } catch (e) {}
      }
    } catch (err) {
      console.warn('NotesSchedule fetchSubjects fallback to local storage', err)
      try {
        const cachedSub = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SUBJECTS_KEY) || '[]')
        if (cachedSub.length > 0) setSubjects(cachedSub)
      } catch (e) {}
    }
  }

  const fetchNotes = async () => {
    try {
      const params = {}
      if (filterSubject) params.subject_id = filterSubject
      if (filterCompleted !== '') params.is_completed = filterCompleted
      const res = await axios.get('/api/notes', { params })
      if (Array.isArray(res.data)) {
        setNotes(res.data)
        if (!filterSubject && filterCompleted === '') {
          try {
            localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(res.data))
          } catch (e) {}
        }
        return
      }
    } catch (err) {
      console.warn('NotesSchedule fetchNotes using local storage cache', err)
    }

    // Fallback to local storage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY)
      if (saved) {
        let list = JSON.parse(saved)
        if (Array.isArray(list)) {
          if (filterSubject) {
            list = list.filter(n => String(n.subject_id) === String(filterSubject))
          }
          if (filterCompleted !== '') {
            list = list.filter(n => String(n.is_completed) === String(filterCompleted))
          }
          setNotes(list)
        }
      }
    } catch (e) {}
  }

  const handleCreateNote = async (e) => {
    e.preventDefault()
    if (!newNote.title.trim()) return

    const matchedSubject = subjects.find(s => String(s.id) === String(newNote.subject_id))
    const noteItem = {
      id: Date.now(),
      subject_id: newNote.subject_id ? parseInt(newNote.subject_id) : null,
      subject_name: matchedSubject ? matchedSubject.name : null,
      subject_code: matchedSubject ? matchedSubject.code : null,
      subject_color: matchedSubject ? matchedSubject.color : null,
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      remind_at: newNote.remind_at || null,
      deadline: newNote.deadline || null,
      priority: newNote.priority || 'normal',
      tag: newNote.tag || 'Bài tập',
      is_completed: 0,
      created_at: new Date().toISOString()
    }

    const payload = {
      subject_id: noteItem.subject_id,
      title: noteItem.title,
      content: noteItem.content,
      remind_at: noteItem.remind_at,
      deadline: noteItem.deadline,
      priority: noteItem.priority,
      tag: noteItem.tag
    }

    try {
      const res = await axios.post('/api/notes', payload)
      if (res.data && res.data.id) {
        noteItem.id = res.data.id
        if (res.data.subject_name) noteItem.subject_name = res.data.subject_name
        if (res.data.subject_code) noteItem.subject_code = res.data.subject_code
      }
    } catch (err) {
      console.warn('Note saved locally (server offline or unavailable):', err)
    }

    // Always update isolated user vault immediately & trigger cloud sync
    const currentAll = getVaultItem('notes', [])
    const updatedAll = [noteItem, ...currentAll.filter(n => n.id !== noteItem.id)]
    setNotes(updatedAll)
    setVaultItem('notes', updatedAll)
    if (currentUser) {
      setTimeout(() => syncCloudData(), 1200)
    }

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
  }

  const handleToggle = async (id) => {
    try {
      await axios.put(`/api/notes/${id}/toggle`)
    } catch (err) {
      console.warn('Toggled note locally:', err)
    }

    const currentAll = getVaultItem('notes', notes)
    const updatedAll = currentAll.map(n =>
      n.id === id ? { ...n, is_completed: n.is_completed === 1 ? 0 : 1 } : n
    )
    setNotes(updatedAll)
    setVaultItem('notes', updatedAll)
    if (currentUser) {
      setTimeout(() => syncCloudData(), 1200)
    }

    fetchNotes()
  }

  const confirmDeleteNote = async () => {
    if (!deleteTargetNote) return
    setDeleting(true)
    try {
      await axios.delete(`/api/notes/${deleteTargetNote.id}`)
    } catch (err) {
      console.warn('Deleted note locally:', err)
    }

    const currentAll = getVaultItem('notes', notes)
    const updatedAll = currentAll.filter(n => n.id !== deleteTargetNote.id)
    setNotes(updatedAll)
    setVaultItem('notes', updatedAll)
    if (currentUser) {
      setTimeout(() => syncCloudData(), 1200)
    }

    setDeleteTargetNote(null)
    setDeleting(false)
    fetchNotes()
  }

  const confirmCleanCompleted = async () => {
    setDeleting(true)
    try {
      await axios.delete('/api/notes/completed')
    } catch (err) {
      console.warn('Cleaned completed notes locally:', err)
    }

    const currentAll = getVaultItem('notes', notes)
    const updatedAll = currentAll.filter(n => n.is_completed !== 1)
    setNotes(updatedAll)
    setVaultItem('notes', updatedAll)
    if (currentUser) {
      setTimeout(() => syncCloudData(), 1200)
    }

    setShowCleanCompletedModal(false)
    setDeleting(false)
    fetchNotes()
  }

  // Filtered notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(n =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.subject_name && n.subject_name.toLowerCase().includes(q)) ||
      (n.tag && n.tag.toLowerCase().includes(q))
    )
  }, [notes, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-400" />
            Sổ Ghi Chú & Lịch Trình Môn Học
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Ghi chú bài học, đặt ngày giờ hẹn nhắc nhở và quản lý deadline đồ án
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ghi Chú / Deadline</span>
        </button>
      </div>

      {/* Filters & Search bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, nhãn môn học..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-white p-1 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Lọc:</span>
          </div>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">Tất cả môn học</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            value={filterCompleted}
            onChange={e => setFilterCompleted(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Đang chờ xử lý</option>
            <option value="1">Đã hoàn thành</option>
          </select>

          {notes.some(n => n.is_completed === 1) && (
            <button
              onClick={() => setShowCleanCompletedModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn dẹp đã xong</span>
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => {
            const isDone = note.is_completed === 1
            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDone
                    ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        note.priority === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
                      onClick={() => setDeleteTargetNote(note)}
                      title="Xóa ghi chú này"
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
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
                      <span>Nhắc: {note.remind_at.replace('T', ' ')}</span>
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
      ) : (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery ? 'Không tìm thấy ghi chú phù hợp' : 'Chưa có ghi chú hoặc deadline nào'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {searchQuery
              ? `Không tìm thấy ghi chú nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm từ khóa khác.`
              : 'Ghi lại bài tập cần nộp, lịch thi, đồ án quan trọng hoặc ghi chú bài giảng để hệ thống nhắc nhở bạn đúng hẹn.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ghi Chú Đầu Tiên</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Add Note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-400" />
                Thêm Ghi Chú & Lịch Học
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Môn học liên quan</label>
                <select
                  value={newNote.subject_id}
                  onChange={e => setNewNote({ ...newNote, subject_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Nội dung cần nhớ, link tham khảo, ghi chú giảng viên dặn..."
                  value={newNote.content}
                  onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày giờ nhắc nhở</label>
                  <input
                    type="datetime-local"
                    value={newNote.remind_at}
                    onChange={e => setNewNote({ ...newNote, remind_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn chót (Deadline)</label>
                  <input
                    type="datetime-local"
                    value={newNote.deadline}
                    onChange={e => setNewNote({ ...newNote, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={newNote.priority}
                    onChange={e => setNewNote({ ...newNote, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
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
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Lưu Ghi Chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Note */}
      {deleteTargetNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa ghi chú</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-xs text-slate-300 font-medium break-words">
              "{deleteTargetNote.title}"
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTargetNote(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteNote}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clean All Completed Notes */}
      {showCleanCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Dọn dẹp ghi chú cũ</h3>
                <p className="text-xs text-slate-400">Xóa tất cả các ghi chú đã xong</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ các ghi chú đã đánh dấu hoàn thành khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowCleanCompletedModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmCleanCompleted}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang dọn dẹp...' : 'Xóa tất cả'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
