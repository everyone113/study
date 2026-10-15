import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Award,
  BookOpen,
  Check,
  X,
  Calculator,
  Calendar,
  User,
  MapPin
} from 'lucide-react'

export default function AcademicDashboard() {
  const [subjects, setSubjects] = useState([])
  const [gpaSummary, setGpaSummary] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGradeSub, setEditingGradeSub] = useState(null)

  // Form states
  const [newSub, setNewSub] = useState({
    code: '',
    name: '',
    credits: 3,
    teacher: '',
    room: '',
    schedule: '',
    semester: 'Học kỳ 1',
    color: '#3b82f6'
  })

  const [gradeInput, setGradeInput] = useState({
    attendance: '',
    midterm: '',
    final: '',
    weight_attendance: 0.1,
    weight_midterm: 0.3,
    weight_final: 0.6
  })

  useEffect(() => {
    fetchAcademicData()
  }, [])

  const fetchAcademicData = async () => {
    try {
      const [resSub, resGpa] = await Promise.all([
        axios.get('/api/subjects'),
        axios.get('/api/gpa/summary')
      ])
      setSubjects(resSub.data)
      setGpaSummary(resGpa.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/subjects', newSub)
      setShowAddModal(false)
      setNewSub({
        code: '',
        name: '',
        credits: 3,
        teacher: '',
        room: '',
        schedule: '',
        semester: 'Học kỳ 1',
        color: '#3b82f6'
      })
      fetchAcademicData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi tạo môn học')
    }
  }

  const handleDeleteSubject = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa môn học này không?')) {
      await axios.delete(`/api/subjects/${id}`)
      fetchAcademicData()
    }
  }

  const openGradeModal = (sub) => {
    setEditingGradeSub(sub)
    const g = sub.grade || {}
    setGradeInput({
      attendance: g.attendance ?? '',
      midterm: g.midterm ?? '',
      final: g.final ?? '',
      weight_attendance: g.weight_attendance ?? 0.1,
      weight_midterm: g.weight_midterm ?? 0.3,
      weight_final: g.weight_final ?? 0.6
    })
  }

  const handleSaveGrade = async (e) => {
    e.preventDefault()
    if (!editingGradeSub) return
    try {
      const payload = {
        attendance: gradeInput.attendance !== '' ? parseFloat(gradeInput.attendance) : null,
        midterm: gradeInput.midterm !== '' ? parseFloat(gradeInput.midterm) : null,
        final: gradeInput.final !== '' ? parseFloat(gradeInput.final) : null,
        weight_attendance: parseFloat(gradeInput.weight_attendance),
        weight_midterm: parseFloat(gradeInput.weight_midterm),
        weight_final: parseFloat(gradeInput.weight_final)
      }
      await axios.post(`/api/subjects/${editingGradeSub.id}/grades`, payload)
      setEditingGradeSub(null)
      fetchAcademicData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi lưu điểm')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top GPA Summary Bar */}
      {gpaSummary && (
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Tổng kết học tập
              </div>
              <div className="text-2xl font-extrabold text-white flex items-center gap-3">
                <span>GPA 4.0: <span className="text-blue-400">{gpaSummary.gpa_4.toFixed(2)}</span></span>
                <span className="text-slate-600">|</span>
                <span>GPA 10: <span className="text-indigo-400">{gpaSummary.gpa_10.toFixed(2)}</span></span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Xếp loại: <span className="text-emerald-400 font-semibold">{gpaSummary.classification}</span> ({gpaSummary.graded_credits}/{gpaSummary.total_credits} tín chỉ)
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Môn Học</span>
          </button>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map(sub => {
          const g = sub.grade || {}
          const hasGrade = g.total_score_10 !== null && g.total_score_10 !== undefined
          return (
            <div
              key={sub.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color || '#3b82f6' }}
                    ></div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                      {sub.code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {sub.credits} tín chỉ
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-base text-white mb-2 line-clamp-1">{sub.name}</h3>

                {/* Details */}
                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  {sub.teacher && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sub.teacher}</span>
                    </div>
                  )}
                  {sub.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Phòng {sub.room}</span>
                    </div>
                  )}
                  {sub.schedule && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sub.schedule}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grade Section */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  {hasGrade ? (
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-extrabold text-blue-400 font-mono">
                        {g.total_score_10}
                      </div>
                      <div className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs">
                        Điểm {g.letter_grade} ({g.gpa_4})
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">Chưa nhập điểm</div>
                  )}
                </div>

                <button
                  onClick={() => openGradeModal(sub)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300 text-xs font-medium transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{hasGrade ? 'Sửa Điểm' : 'Nhập Điểm'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Thêm môn học */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Thêm Môn Học Mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mã Môn Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CS101"
                  value={newSub.code}
                  onChange={e => setNewSub({ ...newSub, code: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Môn Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Java Hướng đối tượng"
                  value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tín Chỉ *</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={newSub.credits}
                    onChange={e => setNewSub({ ...newSub, credits: parseInt(e.target.value) || 3 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phòng Học</label>
                  <input
                    type="text"
                    placeholder="A2-301"
                    value={newSub.room}
                    onChange={e => setNewSub({ ...newSub, room: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Giảng Viên Phụ Trách</label>
                <input
                  type="text"
                  placeholder="TS. Nguyễn Văn A"
                  value={newSub.teacher}
                  onChange={e => setNewSub({ ...newSub, teacher: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lịch Học (Thứ, Tiết)</label>
                <input
                  type="text"
                  placeholder="Thứ 3 (Tiết 1-4, 07:00 - 10:30)"
                  value={newSub.schedule}
                  onChange={e => setNewSub({ ...newSub, schedule: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Lưu Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nhập / Sửa Điểm */}
      {editingGradeSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-white">Nhập Điểm Môn Học</h3>
              <button
                onClick={() => setEditingGradeSub(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-blue-400 font-semibold mb-4">
              {editingGradeSub.name} ({editingGradeSub.code})
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              {/* Điểm chuyên cần */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chuyên cần (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="10"
                    value={gradeInput.attendance}
                    onChange={e => setGradeInput({ ...gradeInput, attendance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tỷ lệ (10%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={gradeInput.weight_attendance}
                    onChange={e => setGradeInput({ ...gradeInput, weight_attendance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Điểm giữa kỳ */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Giữa kỳ (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="8.5"
                    value={gradeInput.midterm}
                    onChange={e => setGradeInput({ ...gradeInput, midterm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tỷ lệ (30%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={gradeInput.weight_midterm}
                    onChange={e => setGradeInput({ ...gradeInput, weight_midterm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Điểm cuối kỳ */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cuối kỳ (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="9.0"
                    value={gradeInput.final}
                    onChange={e => setGradeInput({ ...gradeInput, final: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tỷ lệ (60%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={gradeInput.weight_final}
                    onChange={e => setGradeInput({ ...gradeInput, weight_final: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGradeSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Lưu & Tính Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
