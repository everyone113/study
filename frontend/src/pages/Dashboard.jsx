import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  GraduationCap,
  CalendarCheck,
  FileDown,
  FileText,
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
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Quote,
  Compass,
  Brain,
  Layers,
  Shield,
  Zap,
  RotateCcw,
  BarChart2,
  Settings,
  Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
  const { getVaultItem, currentUser, activeUserId, openAuthModal } = useAuth()
  const [speaking, setSpeaking] = useState(false)
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const [gpaSummary, setGpaSummary] = useState(() => {
    return getVaultItem('gpa_summary', { gpa_4: 0, gpa_10: 0, total_credits: 0, graded_credits: 0, classification: 'Chưa có điểm' })
  })

  const [subjects, setSubjects] = useState(() => {
    return getVaultItem('academic_subjects', [])
  })

  const [notes, setNotes] = useState(() => {
    return getVaultItem('notes', [])
  })

  // Reload state automatically when switching user accounts
  useEffect(() => {
    const handleUserChanged = () => {
      setGpaSummary(getVaultItem('gpa_summary', { gpa_4: 0, gpa_10: 0, total_credits: 0, graded_credits: 0, classification: 'Chưa có điểm' }))
      setSubjects(getVaultItem('academic_subjects', []))
      setNotes(getVaultItem('notes', []))
    }
    window.addEventListener('studymedia:user_changed', handleUserChanged)
    return () => window.removeEventListener('studymedia:user_changed', handleUserChanged)
  }, [getVaultItem])

  const [loading, setLoading] = useState(true)

  // 30-Second Philosophical Quote Rotation
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * PHILOSOPHY_QUOTES.length))
  const [fade, setFade] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [activeUserId])

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

  const handleSpeakQuote = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
        return
      }
      window.speechSynthesis.cancel()
      const text = `${currentQuote.category}. ${currentQuote.concept}. ${currentQuote.content}. ${currentQuote.author}`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'vi-VN'
      utterance.rate = 0.95
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
    } else {
      alert('Trình duyệt không hỗ trợ Web Speech TTS!')
    }
  }

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
      {/* Top Header Row of Dashboard: Title + Status Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Bảng Điều Khiển Tổng Quan
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Trạm điều hành học tập & công cụ cá nhân tiện lợi
          </p>
        </div>

        {/* Right Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Báo Nói Button with TTS voice reading */}
          <button
            onClick={handleSpeakQuote}
            title={speaking ? 'Dừng đọc' : 'Bật giọng đọc báo nói triết học'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Báo Nói</span>
            <span className={`w-1.5 h-1.5 rounded-full ${speaking ? 'bg-blue-400 animate-ping' : 'bg-blue-400'}`} />
          </button>

          {/* Real-time Clock */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{timeStr || '15:20:22'}</span>
          </div>

          {/* FastAPI Online Status */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI Online</span>
          </div>

          {/* User Account Dropdown Pill */}
          <button
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-white text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
              RE
            </div>
            <div className="text-left leading-tight hidden lg:block">
              <span className="font-bold text-[11px] block">{currentUser?.name || 'Redmi19052008'}</span>
              <span className="text-[9px] text-slate-400 block -mt-0.5">Học tập • Tài khoản</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Hero Banner: Triết Học 30 Giây with Landscape Artwork */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1424] via-[#101b38] to-[#151f42] border border-blue-500/25 p-6 md:p-8 shadow-2xl transition-all group min-h-[200px]"
      >
        {/* Landscape Vector Illustration on the Right */}
        <svg
          className="absolute right-0 top-0 bottom-0 h-full w-[460px] pointer-events-none select-none z-0"
          viewBox="0 0 500 240"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#c084fc" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="fadeMask" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d1424" stopOpacity="1" />
              <stop offset="30%" stopColor="#0d1424" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#0d1424" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0d1424" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Stars */}
          <circle cx="120" cy="40" r="1.5" fill="#ffffff" opacity="0.6" />
          <circle cx="200" cy="25" r="1.2" fill="#ffffff" opacity="0.5" />
          <circle cx="280" cy="45" r="1" fill="#ffffff" opacity="0.4" />
          <circle cx="340" cy="30" r="1.5" fill="#ffffff" opacity="0.7" />
          <circle cx="420" cy="50" r="1.2" fill="#ffffff" opacity="0.5" />
          <circle cx="160" cy="70" r="1" fill="#ffffff" opacity="0.3" />

          {/* Glowing Moon / Celestial Orb with rings */}
          <circle cx="340" cy="110" r="54" fill="url(#moonGlow)" />
          <circle cx="340" cy="110" r="32" fill="#fbcfe8" opacity="0.9" />
          <ellipse cx="340" cy="110" rx="48" ry="13" stroke="#e879f9" strokeWidth="1.5" opacity="0.5" transform="rotate(-15 340 110)" />

          {/* Background Mountains */}
          <path d="M100 240 C 180 170, 260 160, 360 180 C 420 190, 480 165, 500 155 L 500 240 Z" fill="#131c38" opacity="0.75" />

          {/* Midground Hills */}
          <path d="M60 240 C 140 190, 240 180, 320 195 C 400 210, 460 190, 500 180 L 500 240 Z" fill="#0f172a" />

          {/* Pine Trees Silhouettes along the ridge */}
          <polygon points="260,190 263,174 266,190" fill="#090d16" />
          <polygon points="270,192 274,172 278,192" fill="#090d16" />
          <polygon points="282,194 285,178 288,194" fill="#090d16" />
          <polygon points="295,196 299,170 303,196" fill="#090d16" />
          <polygon points="310,198 314,174 318,198" fill="#090d16" />
          <polygon points="380,208 384,185 388,208" fill="#090d16" />
          <polygon points="392,206 396,180 400,206" fill="#090d16" />
          <polygon points="405,204 410,178 415,204" fill="#090d16" />
          <polygon points="420,202 424,184 428,202" fill="#090d16" />
          <polygon points="440,198 445,175 450,198" fill="#090d16" />
          <polygon points="455,195 460,172 465,195" fill="#090d16" />
          <polygon points="470,190 475,168 480,190" fill="#090d16" />

          {/* Foreground Ridge */}
          <path d="M0 240 C 80 215, 200 210, 300 220 C 400 230, 460 220, 500 210 L 500 240 Z" fill="#080c14" />

          {/* Left Fade Gradient Mask */}
          <rect x="0" y="0" width="220" height="240" fill="url(#fadeMask)" />
        </svg>

        {/* Content on Left */}
        <div className="relative z-10 flex flex-col justify-between">
          {/* Header Row: Category Badge + 30s Countdown / Controls */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-200 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentQuote.category}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">{currentQuote.concept}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                <span>⌛</span>
                <span>{isPaused ? 'Tạm dừng' : `Đổi sau ${Math.ceil(30 - (progress * 30) / 100)}s`}</span>
              </span>
              <div className="flex items-center gap-0.5 bg-slate-900/60 rounded-xl p-0.5 border border-slate-700/80">
                <button
                  onClick={handlePrevQuote}
                  title="Câu trước"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextQuote}
                  title="Câu tiếp theo"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quote Body: Elegant italic quote */}
          <div className={`transition-opacity duration-300 my-2 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium leading-relaxed italic max-w-2xl select-text">
              “{currentQuote.content}”
            </p>
            <div className="mt-2 text-xs sm:text-sm font-semibold text-sky-400 font-mono italic">
              — {currentQuote.author}
            </div>
          </div>

          {/* Cyan Neon Accent Bar at bottom left */}
          <div className="mt-4 w-28 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.85)]" />
        </div>
      </div>

      {/* Stats Grid: 4 Rich Gradient Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GPA Thang 4 */}
        <div className="relative overflow-hidden rounded-3xl p-5 border border-blue-500/30 bg-gradient-to-br from-blue-900/50 via-[#0e1f3d] to-[#0a1529] shadow-xl hover:border-blue-400/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 mb-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">GPA THÁNG 4</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-1 relative z-10">
            {gpa4 > 0 ? gpa4.toFixed(2) : '4.00'}
          </div>
          <div className="text-xs font-semibold text-sky-400 relative z-10">
            Xếp loại: {classification || 'Xuất sắc'}
          </div>
        </div>

        {/* GPA Thang 10 */}
        <div className="relative overflow-hidden rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-900/50 via-[#18163d] to-[#0e0f29] shadow-xl hover:border-indigo-400/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 mb-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">GPA THÁNG 10</span>
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-1 relative z-10">
            {gpa10 > 0 ? gpa10.toFixed(2) : '8.79'}
          </div>
          <div className="text-xs font-semibold text-slate-400 relative z-10">
            Tổng số tín chỉ: {totalCredits || 3}
          </div>
        </div>

        {/* Môn đang học */}
        <div className="relative overflow-hidden rounded-3xl p-5 border border-teal-500/30 bg-gradient-to-br from-teal-950/70 via-[#0d2824] to-[#081816] shadow-xl hover:border-teal-400/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 mb-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">MÔN ĐANG HỌC</span>
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-1 relative z-10">
            {safeSubjects.length > 0 ? safeSubjects.length : 1}
          </div>
          <div className="text-xs font-semibold text-emerald-400 relative z-10">
            {gradedCredits || 3} tín chỉ đã có điểm
          </div>
        </div>

        {/* Deadline / Note */}
        <div className="relative overflow-hidden rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-[#2b1d0c] to-[#181007] shadow-xl hover:border-amber-400/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 mb-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider">DEADLINE / NOTE</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-1 relative z-10">
            {pendingNotes.length}
          </div>
          <div className="text-xs font-semibold text-amber-400 relative z-10">
            {pendingNotes.length > 0 ? `${pendingNotes.length} việc cần hoàn thành` : 'Đã hoàn thành hết!'}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards: 2 Rows x 4 Columns */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
          <span>LỐI TẮT TRUY CẬP NHANH</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Môn & Bảng Điểm */}
          <button
            onClick={() => setCurrentTab('academic')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Môn & Bảng Điểm</div>
                <div className="text-xs text-slate-400 truncate">Xem GPA & lịch môn</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 2: Atlas Giải Phẫu 3D */}
          <button
            onClick={() => setCurrentTab('anatomy')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">Atlas Giải Phẫu 3D</span>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                    YKhoa
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate">Mô hình 3D & tra cứu</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 3: Ôn Code Java/C++ */}
          <button
            onClick={() => setCurrentTab('code')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Ôn Code Java/C++</div>
                <div className="text-xs text-slate-400 truncate">Chạy code JDK 21</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 4: Tải Video & Lách Trùng */}
          <button
            onClick={() => setCurrentTab('media')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Tải Video & Lách Trùng</div>
                <div className="text-xs text-slate-400 truncate">TikTok, YouTube, Ext</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 5: Dịch Sub */}
          <button
            onClick={() => setCurrentTab('smart')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Dịch Sub</div>
                <div className="text-xs text-slate-400 truncate">Sub realtime đa ngôn ngữ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 6: Kho Tài Liệu */}
          <button
            onClick={() => setCurrentTab('documents')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Kho Tài Liệu</div>
                <div className="text-xs text-slate-400 truncate">Giáo trình, đề thi, tài liệu</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 7: Tiện ích AI */}
          <button
            onClick={() => setCurrentTab('smart')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Tiện ích AI</div>
                <div className="text-xs text-slate-400 truncate">Hỗ trợ học tập & sáng tạo</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 8: Cài đặt & Cá nhân */}
          <button
            onClick={() => openAuthModal('login')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Cài đặt & Cá nhân</div>
                <div className="text-xs text-slate-400 truncate">Tùy chỉnh trải nghiệm</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
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
