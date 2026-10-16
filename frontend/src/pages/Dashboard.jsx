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
  BookOpen,
  Trash2,
  CheckCircle,
  Circle,
  QrCode,
  Wifi,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Quote,
  Compass,
  Brain,
  Layers,
  Shield,
  Zap,
  RotateCcw
} from 'lucide-react'

// Kho Tàng Triết Học Học Tập (Xoay chuyển mỗi 30s)
// Kết hợp Triết học Mác - Lênin, Khắc kỷ (Stoicism), Hiện sinh và Triết học Phương Đông - Tây
export const PHILOSOPHY_QUOTES = [
  {
    category: 'Phép Biện Chứng Duy Vật',
    concept: 'Quy Luật Lượng - Chất',
    icon: 'Layers',
    content: 'Tích lũy về lượng đến một giới hạn nhất định sẽ dẫn đến sự biến đổi nhảy vọt về chất. Đừng nản lòng khi thấy tiến bộ mỗi ngày có vẻ nhỏ bé; từng giờ kiên trì học tập hôm nay chính là lượng đang tích lũy để tạo nên bước nhảy vọt ngày mai.',
    author: 'Triết học Mác - Lênin (Phép biện chứng duy vật)'
  },
  {
    category: 'Chủ Nghĩa Khắc Kỷ (Stoicism)',
    concept: 'Phân Định Quyền Kiểm Soát',
    icon: 'Shield',
    content: 'Bạn có toàn quyền kiểm soát tâm trí và nỗ lực của chính mình, chứ không phải các biến cố bên ngoài. Nhận ra điều này, bạn sẽ tìm thấy sự bình thản sâu sắc và nguồn sức mạnh nội tại vô hạn.',
    author: 'Marcus Aurelius — Hoàng đế La Mã, tác giả "Suy tưởng"'
  },
  {
    category: 'Nhận Thức Luận Duy Vật',
    concept: 'Thực Tiễn Là Tiêu Chuẩn Chân Lý',
    icon: 'CheckCircle2',
    content: 'Thực tiễn là điểm khởi đầu, động lực và là thước đo cao nhất để kiểm nghiệm chân lý. Mọi lý thuyết, công thức dù hoàn mỹ đến đâu cũng chỉ thực sự có giá trị khi được vận dụng giải quyết bài toán thực tế.',
    author: 'Nhận thức luận duy vật biện chứng'
  },
  {
    category: 'Triết Học Cổ Điển Hy Lạp',
    concept: 'Khiêm Tốn Tri Thức',
    icon: 'Sparkles',
    content: 'Tôi chỉ biết một điều duy nhất: đó là tôi không biết gì cả. Ý thức được giới hạn của bản thân trước kho tàng tri thức vô tận của nhân loại chính là khởi đầu của trí tuệ chân chính.',
    author: 'Socrates — Bậc thầy triết học Hy Lạp cổ đại'
  },
  {
    category: 'Triết Học Hiện Sinh',
    concept: 'Sự Tồn Tại Đi Trước Bản Chất',
    icon: 'Compass',
    content: 'Sự tồn tại đi trước bản chất. Con người không sinh ra với một số phận được định sẵn; chính những lựa chọn, hành động tự giác và trách nhiệm mỗi ngày sẽ định nghĩa bạn là ai.',
    author: 'Jean-Paul Sartre — Triết gia Hiện sinh'
  },
  {
    category: 'Phép Biện Chứng Duy Vật',
    concept: 'Quy Luật Mâu Thuẫn',
    icon: 'TrendingUp',
    content: 'Sự thống nhất và đấu tranh giữa các mặt đối lập là nguồn gốc và động lực của mọi sự vận động, phát triển. Khi bạn đối mặt với khó khăn hay lỗ hổng kiến thức, đó chính là mâu thuẫn thúc đẩy năng lực bạn vươn lên tầm cao mới.',
    author: 'Quy luật Mâu thuẫn (Phép biện chứng duy vật)'
  },
  {
    category: 'Chủ Nghĩa Khắc Kỷ (Stoicism)',
    concept: 'Amor Fati - Yêu Lấy Định Mệnh',
    icon: 'Sparkles',
    content: 'Amor Fati - Đừng mong cầu mọi sự việc diễn ra theo ý muốn của mình, hãy đón nhận mọi nghịch cảnh như một chất liệu quý giá để rèn giũa bản lĩnh và sự kiên cường.',
    author: 'Epictetus — Triết gia Khắc kỷ'
  },
  {
    category: 'Triết Học Duy Lý',
    concept: 'Tư Duy Phản Biện Khoa Học',
    icon: 'Brain',
    content: 'Tôi tư duy, nên tôi tồn tại (Cogito, ergo sum). Sự nghi ngờ phương pháp luận và tinh thần phản biện khoa học là chiếc chìa khóa mở toang cánh cửa tri thức đích thực.',
    author: 'René Descartes — Cha đẻ triết học hiện đại'
  },
  {
    category: 'Triết Học Phương Đông',
    concept: 'Vô Vi Nhi Vô Bất Vi',
    icon: 'Sparkles',
    content: 'Hành trình vạn dặm khởi đầu từ một bước chân. Nước mềm mại uốn lượn nhưng chảy mãi có thể làm mòn đá cứng; sự kiên định bền bỉ từng ngày sẽ giúp bạn chinh phục mọi mục tiêu học vấn to lớn.',
    author: 'Lão Tử — Đạo Đức Kinh'
  },
  {
    category: 'Phép Biện Chứng Duy Vật',
    concept: 'Quy Luật Phủ Định Của Phủ Định',
    icon: 'RotateCcw',
    content: 'Sự phát triển diễn ra theo đường xoáy ốc kế thừa và thăng tiến. Một lần thất bại hay bài kiểm tra chưa ưng ý là sự phủ định cần thiết để bạn hoàn thiện phương pháp và bước lên đỉnh cao hơn.',
    author: 'Quy luật Phủ định của Phủ định (Triết học Mác - Lênin)'
  },
  {
    category: 'Triết Học Phương Tây',
    concept: 'Ý Chí Kiên Cường',
    icon: 'Zap',
    content: 'Những gì không đánh gục được tôi sẽ khiến tôi trở nên mạnh mẽ hơn. Nghịch cảnh và áp lực học tập chính là chiếc đe thử lửa để tôi luyện ý chí phi thường trong bạn.',
    author: 'Friedrich Nietzsche — Triết gia phương Tây'
  },
  {
    category: 'Đạo Đức Học Cổ Điển',
    concept: 'Thói Quen Rèn Luyện Mỗi Ngày',
    icon: 'BookOpen',
    content: 'Chúng ta là kết quả của những gì chúng ta lặp đi lặp lại hàng ngày. Vì vậy, sự xuất sắc không phải là một hành vi ngẫu nhiên, mà là một thói quen được rèn luyện kỷ luật.',
    author: 'Aristotle — Triết gia Hy Lạp cổ đại'
  },
  {
    category: 'Chủ Nghĩa Khắc Kỷ (Stoicism)',
    concept: 'Làm Chủ Tâm Trí Trước Lo Lắng',
    icon: 'Shield',
    content: 'Chúng ta chịu khổ sở vì những suy diễn trong trí tưởng tượng nhiều hơn là vì thực tế cuộc đời. Hãy nhìn nhận bài học và thử thách đúng với bản chất của nó, không tô vẽ thêm nỗi âu lo.',
    author: 'Seneca — Triết gia La Mã cổ đại'
  },
  {
    category: 'Triết Học Phương Đông',
    concept: 'Học Đi Đôi Với Suy Tưởng',
    icon: 'GraduationCap',
    content: 'Học mà không suy nghĩ thì mờ tối, suy nghĩ mà không học thì hiểm nguy. Tri thức chỉ thực sự biến thành sức mạnh khi được chiêm nghiệm sâu sắc và chuyển hóa thành hành động cụ thể.',
    author: 'Khổng Tử — Luận Ngữ'
  },
  {
    category: 'Triết Học Khai Sáng',
    concept: 'Mệnh Lệnh Đạo Đức Phổ Quát',
    icon: 'Compass',
    content: 'Hai điều luôn lấp đầy tâm trí tôi với sự kinh ngạc và tôn kính không ngừng tăng lên: bầu trời đầy sao trên đầu tôi và quy luật đạo đức bên trong lòng tôi.',
    author: 'Immanuel Kant — Triết học Khai sáng Đức'
  },
  {
    category: 'Triết Học Hiện Sinh',
    concept: 'Sức Sống Bất Diệt Trong Tâm Hồn',
    icon: 'Sparkles',
    content: 'Ở giữa mùa đông buốt giá nhất của cuộc đời, cuối cùng tôi nhận ra bên trong mình có một mùa hè bất diệt không gì có thể dập tắt nổi.',
    author: 'Albert Camus — Nhà văn, triết gia Hiện sinh'
  },
  {
    category: 'Phép Biện Chứng Duy Vật',
    concept: 'Tính Cụ Thể Của Chân Lý',
    icon: 'Layers',
    content: 'Không có chân lý trừu tượng, chân lý luôn luôn là cụ thể. Mọi bài toán, dòng code hay quyết định đúng đắn đều phải đặt trong ngữ cảnh và điều kiện thực tiễn khách quan.',
    author: 'V.I. Lênin'
  },
  {
    category: 'Phép Biện Chứng Duy Vật',
    concept: 'Mối Quan Hệ Vật Chất & Ý Thức',
    icon: 'Brain',
    content: 'Vật chất quyết định ý thức, nhưng ý thức có tính độc lập tương đối và tác động trở lại mạnh mẽ thông qua hoạt động thực tiễn. Một mục tiêu rõ ràng và ý chí tự học bền bỉ sẽ kiến tạo nên tương lai của chính bạn.',
    author: 'Triết học Mác - Lênin (Chủ nghĩa duy vật biện chứng)'
  }
]

export default function Dashboard({ setCurrentTab }) {
  const [gpaSummary, setGpaSummary] = useState(() => {
    try {
      const cached = localStorage.getItem('studymedia_gpa_summary')
      if (cached) return JSON.parse(cached)
    } catch (e) {}
    return { gpa_4: 0, gpa_10: 0, total_credits: 0, graded_credits: 0, classification: 'Chưa có điểm' }
  })

  const [subjects, setSubjects] = useState(() => {
    try {
      const cached = localStorage.getItem('studymedia_academic_subjects')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const [notes, setNotes] = useState(() => {
    try {
      const cached = localStorage.getItem('studymedia_notes')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const [loading, setLoading] = useState(true)

  // 30-Second Philosophical Quote Rotation
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * PHILOSOPHY_QUOTES.length))
  const [fade, setFade] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 30-Second Timer with smooth progress indicator
  useEffect(() => {
    if (isPaused) return

    const intervalTime = 100 // update every 100ms
    const step = (intervalTime / 30000) * 100 // reaches 100% in 30,000ms

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Fade out -> change quote -> fade in
          setFade(false)
          setTimeout(() => {
            setQuoteIndex(curr => (curr + 1) % PHILOSOPHY_QUOTES.length)
            setFade(true)
          }, 300)
          return 0
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [isPaused])

  const handleNextQuote = () => {
    setFade(false)
    setTimeout(() => {
      setQuoteIndex(curr => (curr + 1) % PHILOSOPHY_QUOTES.length)
      setProgress(0)
      setFade(true)
    }, 200)
  }

  const handlePrevQuote = () => {
    setFade(false)
    setTimeout(() => {
      setQuoteIndex(curr => (curr - 1 + PHILOSOPHY_QUOTES.length) % PHILOSOPHY_QUOTES.length)
      setProgress(0)
      setFade(true)
    }, 200)
  }

  const currentQuote = PHILOSOPHY_QUOTES[quoteIndex] || PHILOSOPHY_QUOTES[0]

  const fetchDashboardData = async () => {
    try {
      const [resGpa, resSub, resNotes] = await Promise.all([
        axios.get('/api/gpa/summary'),
        axios.get('/api/subjects'),
        axios.get('/api/notes')
      ])
      if (resGpa.data && typeof resGpa.data === 'object') {
        setGpaSummary(resGpa.data)
        try { localStorage.setItem('studymedia_gpa_summary', JSON.stringify(resGpa.data)) } catch (e) {}
      }
      if (Array.isArray(resSub.data)) {
        setSubjects(resSub.data)
        try { localStorage.setItem('studymedia_academic_subjects', JSON.stringify(resSub.data)) } catch (e) {}
      }
      if (Array.isArray(resNotes.data)) {
        setNotes(resNotes.data)
        try { localStorage.setItem('studymedia_notes', JSON.stringify(resNotes.data)) } catch (e) {}
      }
    } catch (err) {
      console.warn('Dashboard API fallback to local storage', err)
      try {
        const cachedSub = JSON.parse(localStorage.getItem('studymedia_academic_subjects') || '[]')
        const cachedGpa = JSON.parse(localStorage.getItem('studymedia_gpa_summary') || 'null')
        const cachedNotes = JSON.parse(localStorage.getItem('studymedia_notes') || '[]')
        if (Array.isArray(cachedSub) && cachedSub.length > 0) setSubjects(cachedSub)
        if (cachedGpa && typeof cachedGpa === 'object') setGpaSummary(cachedGpa)
        if (Array.isArray(cachedNotes) && cachedNotes.length > 0) setNotes(cachedNotes)
      } catch (e) {}
    } finally {
      setLoading(false)
    }
  }

  const handleToggleNote = async (id) => {
    try {
      await axios.put(`/api/notes/${id}/toggle`)
    } catch (err) {
      console.warn('Dashboard toggle note locally:', err)
    }
    try {
      const cached = JSON.parse(localStorage.getItem('studymedia_notes') || '[]')
      const updated = cached.map(n => n.id === id ? { ...n, is_completed: n.is_completed === 1 ? 0 : 1 } : n)
      localStorage.setItem('studymedia_notes', JSON.stringify(updated))
      setNotes(updated)
    } catch (e) {}
    fetchDashboardData()
  }

  const handleDeleteNote = async (id) => {
    try {
      await axios.delete(`/api/notes/${id}`)
    } catch (err) {
      console.warn('Dashboard delete note locally:', err)
    }
    try {
      const cached = JSON.parse(localStorage.getItem('studymedia_notes') || '[]')
      const updated = cached.filter(n => n.id !== id)
      localStorage.setItem('studymedia_notes', JSON.stringify(updated))
      setNotes(updated)
    } catch (e) {}
    fetchDashboardData()
  }

  const safeNotes = Array.isArray(notes) ? notes : []
  const safeSubjects = Array.isArray(subjects) ? subjects : []
  const pendingNotes = safeNotes.filter(n => !n?.is_completed)

  const gpa4 = Number(gpaSummary?.gpa_4) || 0
  const gpa10 = Number(gpaSummary?.gpa_10) || 0
  const totalCredits = Number(gpaSummary?.total_credits) || 0
  const gradedCredits = Number(gpaSummary?.graded_credits) || 0
  const classification = gpaSummary?.classification || 'Chưa có điểm'

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Triết Học 30 Giây (Chỉ ghi nội dung, không có tiêu đề lớn) */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl transition-all group"
      >
        <div className="relative z-10 flex flex-col justify-between min-h-[150px]">
          {/* Header Row: Category Badge + 30s Countdown / Controls */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentQuote.category}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{currentQuote.concept}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                {isPaused ? '⏸️ Tạm dừng' : `⏳ Đổi sau ${Math.ceil(30 - (progress * 30) / 100)}s`}
              </span>
              <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={handlePrevQuote}
                  title="Câu trước"
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextQuote}
                  title="Câu tiếp theo"
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quote Body: ONLY CONTENT (NO BIG HEADING) */}
          <div className={`transition-opacity duration-300 my-auto ${fade ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-base sm:text-lg md:text-xl text-slate-100 font-medium leading-relaxed italic select-text">
              “{currentQuote.content}”
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-400 font-mono">
              <span>—</span>
              <span>{currentQuote.author}</span>
            </div>
          </div>
        </div>

        {/* 30-Second Progress Line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
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
          <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {gpa4.toFixed(2)}
          </div>
          <div className="text-xs text-blue-400 font-medium mt-1">
            Xếp loại: {classification}
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
          <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {gpa10.toFixed(2)}
          </div>
          <div className="text-xs text-indigo-400 font-medium mt-1">
            Tổng số tín chỉ: {totalCredits}
          </div>
        </div>

        {/* Môn đang học */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Môn đang học</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {safeSubjects.length}
          </div>
          <div className="text-xs text-emerald-400 font-medium mt-1">
            {gradedCredits} tín chỉ đã có điểm
          </div>
        </div>

        {/* Deadline / Note */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Deadline / Note</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {pendingNotes.length}
          </div>
          <div className="text-xs text-amber-400 font-medium mt-1">
            {pendingNotes.length > 0 ? `${pendingNotes.length} việc cần hoàn thành` : 'Đã hoàn thành hết!'}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Lối tắt truy cập nhanh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setCurrentTab('academic')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
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
            onClick={() => setCurrentTab('anatomy')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Atlas Giải Phẫu 3D</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Y Khoa
                  </span>
                </div>
                <div className="text-xs text-slate-400">Mô hình 3D & tra cứu</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
          </button>

          <button
            onClick={() => setCurrentTab('code')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Ôn Code Java/C++</div>
                <div className="text-xs text-slate-400">Chạy code JDK 21</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={() => setCurrentTab('media')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
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
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
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

          <button
            onClick={() => setCurrentTab('mobile')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>WiFi Drop</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-xs text-slate-400">Quét QR bắn ảnh từ ĐT</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
              className="text-xs text-blue-400 hover:underline font-medium cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          {safeNotes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Chưa có ghi chú nào. Hãy tạo ghi chú môn học mới!
            </div>
          ) : (
            <div className="space-y-2.5">
              {safeNotes.slice(0, 4).map(note => (
                <div
                  key={note.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    note.is_completed
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleNote(note.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {note.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div
                        className={`font-semibold text-sm ${
                          note.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {note.title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-blue-400">{note.subject_name || 'Chung'}</span>
                        {note.deadline_date && (
                          <span>• Hạn: {note.deadline_date} {note.deadline_time || ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
              className="text-xs text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Quản lý môn
            </button>
          </div>

          {safeSubjects.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Chưa có môn học nào. Hãy bấm "Thêm môn học" ở mục Môn & Điểm số.
            </div>
          ) : (
            <div className="space-y-2.5">
              {safeSubjects.slice(0, 4).map(s => (
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
                    {s.grade && s.grade.total_score_10 !== null && s.grade.total_score_10 !== undefined ? (
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
