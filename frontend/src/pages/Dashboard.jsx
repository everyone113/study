import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  GraduationCap,
  CalendarCheck,
  FileDown,
  Terminal,
  Video,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react'

export default function Dashboard({ setCurrentTab }) {
  const [gpaSummary, setGpaSummary] = useState({ gpa_4: 0, gpa_10: 0, total_credits: 0, classification: 'Chưa có dữ liệu' })
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [resGpa, resSub, resNotes] = await Promise.all([
        axios.get('/api/gpa/summary'),
        axios.get('/api/subjects'),
        axios.get('/api/notes')
      ])
      setGpaSummary(resGpa.data)
      setSubjects(resSub.data)
      setNotes(resNotes.data)
    } catch (err) {
      console.error('Error fetching dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  const pendingNotes = notes.filter(n => !n.is_completed)

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Trạm Điều Hành Học Tập & Media Toàn Diện
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Chào mừng bạn đến với <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">StudyMediaHub</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed">
            Dữ liệu được lưu trữ trực tiếp trên ổ D. Quản lý môn học, luyện code Java/C++, tải video không logo và lách bản quyền video mượt mà trên cả PC và Điện thoại.
          </p>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GPA Thang 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">GPA Thang 4</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            {gpaSummary.gpa_4.toFixed(2)}
          </div>
          <div className="text-xs text-blue-400 font-medium mt-1">
            Xếp loại: {gpaSummary.classification}
          </div>
        </div>

        {/* GPA Thang 10 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">GPA Thang 10</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            {gpaSummary.gpa_10.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Tổng số tín chỉ: {gpaSummary.total_credits}
          </div>
        </div>

        {/* Số môn học */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Môn Đang Học</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            {subjects.length}
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            {gpaSummary.graded_credits || 0} tín chỉ đã có điểm
          </div>
        </div>

        {/* Việc cần làm / Deadline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Deadline / Note</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            {pendingNotes.length}
          </div>
          <div className="text-xs text-amber-400 mt-1">
            Công việc đang chờ hoàn thành
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Lối tắt truy cập nhanh
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentTab('academic')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Môn & Bảng Điểm</div>
                <div className="text-xs text-slate-400">Xem GPA & lịch môn</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </button>

          <button
            onClick={() => setCurrentTab('code')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Ôn Code Java/C++</div>
                <div className="text-xs text-slate-400">Chạy code JDK 21</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          <button
            onClick={() => setCurrentTab('media')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Tải Video & Lách Trùng</div>
                <div className="text-xs text-slate-400">TikTok, YouTube, Exif</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </button>

          <button
            onClick={() => setCurrentTab('smart')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-pink-500/40 hover:bg-slate-800/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Dịch Sub & Giọng AI</div>
                <div className="text-xs text-slate-400">Sub realtime, Edge-TTS</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Two columns: Upcoming Deadlines & Recent Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines list */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              Ghi chú & Deadline gần nhất
            </h3>
            <button
              onClick={() => setCurrentTab('notes')}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Xem tất cả
            </button>
          </div>

          {pendingNotes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Tuyệt vời! Không còn deadline nào đang tồn đọng.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingNotes.slice(0, 4).map(n => (
                <div
                  key={n.id}
                  className="flex items-start justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/60"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">{n.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{n.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-mono">
                      {n.deadline && (
                        <span className="text-amber-400 font-medium">
                          Hạn: {n.deadline.replace('T', ' ')}
                        </span>
                      )}
                      {n.subject_name && <span>• {n.subject_name}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    n.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {n.tag || 'Note'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Subjects List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Danh sách môn học
            </h3>
            <button
              onClick={() => setCurrentTab('academic')}
              className="text-xs text-indigo-400 hover:underline font-medium"
            >
              Quản lý môn
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Chưa có môn học nào. Hãy bấm "Thêm môn học" ở mục Môn & Điểm số.
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjects.slice(0, 4).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color || '#3b82f6' }}
                    ></div>
                    <div>
                      <div className="font-semibold text-sm text-slate-200">
                        {s.name} <span className="text-slate-500 font-mono text-xs">({s.code})</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.credits} tín chỉ {s.room ? `• Phòng ${s.room}` : ''}
                      </div>
                    </div>
                  </div>

                  <div>
                    {s.grade && s.grade.total_score_10 !== null ? (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                        {s.grade.total_score_10} ({s.grade.letter_grade})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Chưa có điểm</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
