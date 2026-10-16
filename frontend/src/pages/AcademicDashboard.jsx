import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
  GraduationCap,
  Plus,
  Trash2,
  Award,
  BookOpen,
  X,
  Calculator,
  Calendar,
  User,
  MapPin,
  Search,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  Info
} from 'lucide-react'

// Calculation helpers
function calculateGradeDetails(score10) {
  if (score10 === null || score10 === undefined || isNaN(score10)) {
    return { gpa_4: null, letter: null }
  }
  const s = Number(score10)
  if (s >= 8.5) return { gpa_4: 4.0, letter: 'A' }
  if (s >= 8.0) return { gpa_4: 3.5, letter: 'B+' }
  if (s >= 7.0) return { gpa_4: 3.0, letter: 'B' }
  if (s >= 6.5) return { gpa_4: 2.5, letter: 'C+' }
  if (s >= 5.5) return { gpa_4: 2.0, letter: 'C' }
  if (s >= 5.0) return { gpa_4: 1.5, letter: 'D+' }
  if (s >= 4.0) return { gpa_4: 1.0, letter: 'D' }
  return { gpa_4: 0.0, letter: 'F' }
}

function classifyGpa(gpa_4) {
  if (!gpa_4 || gpa_4 <= 0) return 'Chưa có điểm'
  if (gpa_4 >= 3.6) return 'Xuất sắc'
  if (gpa_4 >= 3.2) return 'Giỏi'
  if (gpa_4 >= 2.5) return 'Khá'
  if (gpa_4 >= 2.0) return 'Trung bình'
  if (gpa_4 >= 1.0) return 'Yếu'
  return 'Kém'
}

function computeLocalGpaSummary(subjectsList) {
  let totalCredits = 0
  let countedCredits = 0
  let weighted10 = 0.0
  let weighted4 = 0.0

  subjectsList.forEach(s => {
    const cred = Number(s.credits) || 0
    totalCredits += cred
    const g = s.grade || {}
    if (g.total_score_10 !== null && g.total_score_10 !== undefined && cred > 0) {
      countedCredits += cred
      weighted10 += Number(g.total_score_10) * cred
      weighted4 += Number(g.gpa_4 || 0) * cred
    }
  })

  const gpa_10 = countedCredits > 0 ? Number((weighted10 / countedCredits).toFixed(2)) : 0.0
  const gpa_4 = countedCredits > 0 ? Number((weighted4 / countedCredits).toFixed(2)) : 0.0
  return {
    total_credits: totalCredits,
    graded_credits: countedCredits,
    gpa_10,
    gpa_4,
    classification: classifyGpa(gpa_4)
  }
}

const LOCAL_STORAGE_KEY = 'studymedia_academic_subjects'
const LOCAL_GPA_KEY = 'studymedia_gpa_summary'

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ef4444'  // red
]

export default function AcademicDashboard() {
  // Load initially from localStorage so page NEVER renders blank
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const [gpaSummary, setGpaSummary] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_GPA_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {}
    return {
      total_credits: 0,
      graded_credits: 0,
      gpa_10: 0.0,
      gpa_4: 0.0,
      classification: 'Chưa có điểm'
    }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGradeSub, setEditingGradeSub] = useState(null)
  const [loading, setLoading] = useState(false)
  const [serverConnected, setServerConnected] = useState(false)

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

  // Synchronize state changes to localStorage
  const saveSubjectsLocally = (newList) => {
    setSubjects(newList)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList))
    } catch (e) {}
    const newSummary = computeLocalGpaSummary(newList)
    setGpaSummary(newSummary)
    try {
      localStorage.setItem(LOCAL_GPA_KEY, JSON.stringify(newSummary))
    } catch (e) {}
  }

  useEffect(() => {
    fetchAcademicData()
  }, [])

  const fetchAcademicData = async () => {
    setLoading(true)
    try {
      const [resSub, resGpa] = await Promise.all([
        axios.get('/api/subjects'),
        axios.get('/api/gpa/summary')
      ])
      if (Array.isArray(resSub.data)) {
        setSubjects(resSub.data)
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resSub.data))
        } catch (e) {}
      }
      if (resGpa.data) {
        setGpaSummary(resGpa.data)
        try {
          localStorage.setItem(LOCAL_GPA_KEY, JSON.stringify(resGpa.data))
        } catch (e) {}
      }
      setServerConnected(true)
    } catch (err) {
      console.warn('API sync warning: using local storage cache for academic data', err)
      setServerConnected(false)
      // Keep local state and recalculate summary
      setSubjects(prev => {
        const sum = computeLocalGpaSummary(prev)
        setGpaSummary(sum)
        return prev
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    if (!newSub.code.trim() || !newSub.name.trim()) return

    const sanitizedCode = newSub.code.trim().toUpperCase()
    const subjectItem = {
      id: Date.now(),
      code: sanitizedCode,
      name: newSub.name.trim(),
      credits: parseInt(newSub.credits) || 3,
      teacher: newSub.teacher.trim(),
      room: newSub.room.trim(),
      schedule: newSub.schedule.trim(),
      semester: newSub.semester || 'Học kỳ 1',
      color: newSub.color || '#3b82f6',
      grade: {
        attendance: null,
        midterm: null,
        final: null,
        other: null,
        weight_attendance: 0.1,
        weight_midterm: 0.3,
        weight_final: 0.6,
        total_score_10: null,
        gpa_4: null,
        letter_grade: null
      }
    }

    try {
      const res = await axios.post('/api/subjects', {
        ...newSub,
        code: sanitizedCode,
        credits: parseInt(newSub.credits) || 3
      })
      if (res.data && res.data.id) {
        subjectItem.id = res.data.id
      }
    } catch (err) {
      console.warn('Created subject locally (server unreachable or error):', err)
    }

    const updated = [subjectItem, ...subjects.filter(s => s.code !== sanitizedCode)]
    saveSubjectsLocally(updated)

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
  }

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này không?')) return

    try {
      await axios.delete(`/api/subjects/${id}`)
    } catch (err) {
      console.warn('Subject removed from local storage:', err)
    }

    const updated = subjects.filter(sub => sub.id !== id)
    saveSubjectsLocally(updated)
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

  // Live preview inside the modal as user types
  const liveGradePreview = useMemo(() => {
    const att = gradeInput.attendance !== '' ? parseFloat(gradeInput.attendance) : null
    const mid = gradeInput.midterm !== '' ? parseFloat(gradeInput.midterm) : null
    const fin = gradeInput.final !== '' ? parseFloat(gradeInput.final) : null
    const w_att = parseFloat(gradeInput.weight_attendance) || 0.1
    const w_mid = parseFloat(gradeInput.weight_midterm) || 0.3
    const w_fin = parseFloat(gradeInput.weight_final) || 0.6

    if (att !== null && mid !== null && fin !== null) {
      const total_10 = parseFloat((att * w_att + mid * w_mid + fin * w_fin).toFixed(2))
      const details = calculateGradeDetails(total_10)
      return { total_10, ...details }
    }
    return null
  }, [gradeInput])

  const handleSaveGrade = async (e) => {
    e.preventDefault()
    if (!editingGradeSub) return

    const att = gradeInput.attendance !== '' ? parseFloat(gradeInput.attendance) : null
    const mid = gradeInput.midterm !== '' ? parseFloat(gradeInput.midterm) : null
    const fin = gradeInput.final !== '' ? parseFloat(gradeInput.final) : null
    const w_att = parseFloat(gradeInput.weight_attendance) || 0.1
    const w_mid = parseFloat(gradeInput.weight_midterm) || 0.3
    const w_fin = parseFloat(gradeInput.weight_final) || 0.6

    let total_10 = null
    let gpa_4 = null
    let letter = null

    if (att !== null && mid !== null && fin !== null) {
      total_10 = parseFloat((att * w_att + mid * w_mid + fin * w_fin).toFixed(2))
      const gInfo = calculateGradeDetails(total_10)
      gpa_4 = gInfo.gpa_4
      letter = gInfo.letter
    }

    const payload = {
      attendance: att,
      midterm: mid,
      final: fin,
      weight_attendance: w_att,
      weight_midterm: w_mid,
      weight_final: w_fin
    }

    try {
      await axios.post(`/api/subjects/${editingGradeSub.id}/grades`, payload)
    } catch (err) {
      console.warn('Grade saved locally (server offline or unavailable):', err)
    }

    const updated = subjects.map(sub => {
      if (sub.id === editingGradeSub.id) {
        return {
          ...sub,
          grade: {
            ...sub.grade,
            attendance: att,
            midterm: mid,
            final: fin,
            weight_attendance: w_att,
            weight_midterm: w_mid,
            weight_final: w_fin,
            total_score_10: total_10,
            gpa_4: gpa_4,
            letter_grade: letter
          }
        }
      }
      return sub
    })

    saveSubjectsLocally(updated)
    setEditingGradeSub(null)
  }

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      const matchSearch =
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.teacher && sub.teacher.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchSemester =
        selectedSemester === 'all' || (sub.semester && sub.semester === selectedSemester)
      return matchSearch && matchSemester
    })
  }, [subjects, searchQuery, selectedSemester])

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Quản Lý Môn Học & Điểm Số
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Theo dõi tín chỉ, bảng điểm thành phần và tính điểm GPA 4.0 / 10.0 tự động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Môn Học Mới</span>
          </button>
        </div>
      </div>

      {/* GPA Summary Dashboard */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Tổng Kết Kết Quả Học Tập
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                serverConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${serverConnected ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
              {serverConnected ? 'Đồng bộ máy chủ' : 'Bộ nhớ thiết bị'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: GPA 4.0 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-medium">GPA Thang 4.0</div>
            <div className="text-3xl font-extrabold text-blue-400 mt-1 font-mono">
              {(gpaSummary.gpa_4 ?? 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Chuẩn quốc tế / Đại học</div>
          </div>

          {/* Card 2: GPA 10.0 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-medium">GPA Thang 10</div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-1 font-mono">
              {(gpaSummary.gpa_10 ?? 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Hệ điểm Việt Nam</div>
          </div>

          {/* Card 3: Tín chỉ */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-medium">Tín Chỉ Tích Lũy</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
              {gpaSummary.graded_credits ?? 0}
              <span className="text-sm font-normal text-slate-500"> / {gpaSummary.total_credits ?? 0}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Đã có điểm / Tổng đăng ký</div>
          </div>

          {/* Card 4: Xếp loại */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-medium">Xếp Loại Học Lực</div>
            <div className="text-xl md:text-2xl font-bold text-amber-300 mt-1 truncate">
              {gpaSummary.classification || 'Chưa có điểm'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Dựa trên thang điểm 4.0</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            placeholder="Tìm theo tên môn, mã môn hoặc giảng viên..."
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

        <div className="flex items-center gap-2">
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả học kỳ</option>
            <option value="Học kỳ 1">Học kỳ 1</option>
            <option value="Học kỳ 2">Học kỳ 2</option>
            <option value="Học kỳ hè">Học kỳ hè</option>
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map(sub => {
            const g = sub.grade || {}
            const hasGrade = g.total_score_10 !== null && g.total_score_10 !== undefined

            return (
              <div
                key={sub.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Color tag, Code, Credits, Delete */}
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
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Xóa môn học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subject Name */}
                  <h3 className="font-bold text-base text-white mb-2 line-clamp-1" title={sub.name}>
                    {sub.name}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    {sub.semester && (
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sub.semester}</span>
                      </div>
                    )}
                    {sub.teacher && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sub.teacher}</span>
                      </div>
                    )}
                    {sub.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Phòng: {sub.room}</span>
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
                        <div className="text-xl font-extrabold text-blue-400 font-mono">
                          {g.total_score_10}
                        </div>
                        <div className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs">
                          {g.letter_grade} ({g.gpa_4})
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">Chưa nhập điểm</div>
                    )}
                  </div>

                  <button
                    onClick={() => openGradeModal(sub)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{hasGrade ? 'Sửa Điểm' : 'Nhập Điểm'}</span>
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
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery ? 'Không tìm thấy môn học phù hợp' : 'Chưa có môn học nào'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {searchQuery
              ? `Không có môn học nào khớp với từ khóa "${searchQuery}". Hãy thử tìm lại hoặc chọn lại học kỳ.`
              : 'Hãy thêm các môn học kỳ này để theo dõi lịch học, phòng học, giảng viên và tự động tính điểm GPA thang 4.0 và 10.0!'}
          </p>

          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setSelectedSemester('all'); }}
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
              <span>Thêm Môn Học Đầu Tiên</span>
            </button>
          )}
        </div>
      )}

      {/* Modal: Thêm Môn Học */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Thêm Môn Học Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mã Môn Học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: CS101, IT001"
                    value={newSub.code}
                    onChange={e => setNewSub({ ...newSub, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Môn Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cấu trúc Dữ liệu & Giải thuật"
                  value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Học Kỳ</label>
                  <select
                    value={newSub.semester}
                    onChange={e => setNewSub({ ...newSub, semester: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Học kỳ 1">Học kỳ 1</option>
                    <option value="Học kỳ 2">Học kỳ 2</option>
                    <option value="Học kỳ hè">Học kỳ hè</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phòng Học</label>
                  <input
                    type="text"
                    placeholder="B3-204"
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
                  placeholder="ThS. Nguyễn Văn A"
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

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Màu Sắc Nhận Diện</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSub({ ...newSub, color })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newSub.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                  Lưu Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nhập / Sửa Điểm */}
      {editingGradeSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Nhập Điểm Môn Học
              </h3>
              <button
                onClick={() => setEditingGradeSub(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-blue-400 font-semibold mb-4">
              {editingGradeSub.name} ({editingGradeSub.code}) • {editingGradeSub.credits} tín chỉ
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              {/* Chuyên cần */}
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
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

              {/* Giữa kỳ */}
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
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

              {/* Cuối kỳ */}
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500"
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

              {/* Realtime calculation preview */}
              {liveGradePreview && (
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    <div>Tổng kết tạm tính:</div>
                    <div className="text-[11px] text-slate-400">Thang 10: <b className="text-white">{liveGradePreview.total_10}</b></div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-blue-400 font-mono">
                      {liveGradePreview.gpa_4}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold">
                      Điểm {liveGradePreview.letter}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGradeSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30"
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
