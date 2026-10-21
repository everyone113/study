import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Sparkles,
  Subtitles,
  Mic,
  Volume2,
  Layers,
  Timer,
  FileSearch,
  Play,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Globe,
  AlertCircle,
  X
} from 'lucide-react'

export default function SmartUtilities() {
  const [activeTab, setActiveTab] = useState('subtitles') // 'subtitles' | 'tts' | 'flashcards' | 'pomodoro' | 'summarize'
  const [toast, setToast] = useState(null) // { type: 'success' | 'error' | 'info' | 'pomo', message: '' }

  const playChime = (type = 'info') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'error') {
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
      } else if (type === 'success' || type === 'pomo') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24) // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36) // C6
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2)
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    } catch (e) {}
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    playChime(type)
    setTimeout(() => setToast(null), 4000)
  }

  // Subtitle Player states
  const [videoSrc, setVideoSrc] = useState('')
  const [cues, setCues] = useState([])
  const [currentCue, setCurrentCue] = useState(null)
  const [subLoading, setSubLoading] = useState(false)
  const videoRef = useRef(null)
  const [instantText, setInstantText] = useState('')
  const [instantTrans, setInstantTrans] = useState('')

  // TTS states
  const [ttsText, setTtsText] = useState('Chào mừng bạn đến với giảng đường đại học!')
  const [ttsVoice, setTtsVoice] = useState('vi-VN-HoaiMyNeural')
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsResult, setTtsResult] = useState(null)

  // Flashcards states
  const [cards, setCards] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [newCard, setNewCard] = useState({ deck_name: 'Lập trình', front: '', back: '' })

  // Pomodoro states
  const [pomoTime, setPomoTime] = useState(25 * 60)
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoMode, setPomoMode] = useState('work') // 'work' | 'break'

  // Summarize states
  const [sumText, setSumText] = useState('')
  const [sumResult, setSumResult] = useState(null)
  const [sumLoading, setSumLoading] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  // Pomodoro countdown timer
  useEffect(() => {
    let interval = null
    if (pomoRunning && pomoTime > 0) {
      interval = setInterval(() => setPomoTime(t => t - 1), 1000)
    } else if (pomoTime === 0) {
      setPomoRunning(false)
      showToast(
        pomoMode === 'work' ? 'Hết 25 phút tập trung! Hãy nghỉ ngơi 5 phút nhé.' : 'Hết giờ nghỉ! Bắt đầu chặng học mới nào.',
        'pomo'
      )
    }
    return () => clearInterval(interval)
  }, [pomoRunning, pomoTime, pomoMode])

  // Subtitle synchronization on video timeupdate
  const handleTimeUpdate = () => {
    if (!videoRef.current || cues.length === 0) return
    const ct = videoRef.current.currentTime
    const found = cues.find(c => ct >= c.start && ct <= c.end)
    setCurrentCue(found || null)
  }

  // Load sample video or user video file
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
    }
  }

  // Upload and translate SRT file
  const handleSrtUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('target_lang', 'vi')
      const res = await axios.post('/api/subtitles/parse-srt', formData)
      setCues(res.data)
      showToast(`Đã nạp và dịch thành công ${res.data.length} đoạn phụ đề!`, 'success')
    } catch (err) {
      showToast('Lỗi phân tích phụ đề', 'error')
    } finally {
      setSubLoading(false)
    }
  }

  // Instant translator
  const handleInstantTranslate = async () => {
    if (!instantText.trim()) return
    try {
      const res = await axios.post('/api/translate/text', {
        text: instantText,
        source_lang: 'auto',
        target_lang: 'vi'
      })
      setInstantTrans(res.data.translated_text)
    } catch (err) {
      console.error(err)
    }
  }

  // TTS generate
  const handleGenerateTTS = async (e) => {
    e.preventDefault()
    setTtsLoading(true)
    try {
      const res = await axios.post('/api/tools/tts', {
        text: ttsText,
        voice: ttsVoice
      })
      setTtsResult(res.data)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Lỗi tạo giọng đọc', 'error')
    } finally {
      setTtsLoading(false)
    }
  }

  const fetchCards = async () => {
    try {
      const res = await axios.get('/api/tools/flashcards')
      if (Array.isArray(res.data)) {
        setCards(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddCard = async (e) => {
    e.preventDefault()
    if (!newCard.front || !newCard.back) return
    try {
      await axios.post('/api/tools/flashcards', newCard)
      setNewCard({ deck_name: newCard.deck_name, front: '', back: '' })
      fetchCards()
    } catch (err) {
      showToast('Lỗi tạo thẻ', 'error')
    }
  }

  const handleDeleteCard = async (id) => {
    await axios.delete(`/api/tools/flashcards/${id}`)
    fetchCards()
  }

  // Summarize
  const handleSummarize = async (e) => {
    e.preventDefault()
    if (!sumText.trim()) return
    setSumLoading(true)
    try {
      const res = await axios.post('/api/tools/summarize', {
        text: sumText,
        title: 'Tóm tắt bài học'
      })
      setSumResult(res.data)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Lỗi tóm tắt văn bản', 'error')
    } finally {
      setSumLoading(false)
    }
  }

  const formatPomoTime = () => {
    const mins = Math.floor(pomoTime / 60)
    const secs = pomoTime % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Pills */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-2">
        {[
          { id: 'subtitles', label: 'Dịch Sub Realtime', icon: Subtitles },
          { id: 'tts', label: 'Giọng Đọc AI (TTS)', icon: Volume2 },
          { id: 'flashcards', label: 'Flashcards Ôn Bài', icon: Layers },
          { id: 'pomodoro', label: 'Đồng Hồ Pomodoro', icon: Timer },
          { id: 'summarize', label: 'AI Tóm Tắt Slide', icon: FileSearch }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 1. SUBTITLE PLAYER */}
      {activeTab === 'subtitles' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <Subtitles className="w-5 h-5 text-pink-400" />
              Xem Phim & Dịch Phụ Đề Thời Gian Thực
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Nạp video (phim/bài giảng) và file phụ đề SRT. Hệ thống sẽ tự động hiển thị phụ đề dịch song ngữ chạy khớp từng khung hình ở dưới video!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">1. Chọn video từ máy:</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-pink-600 file:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">2. Chọn file phụ đề (.srt / .vtt):</label>
                <input
                  type="file"
                  accept=".srt,.vtt,.txt"
                  onChange={handleSrtUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white"
                />
              </div>
            </div>
          </div>

          {/* Video Player Box with Realtime Subtitle Overlay */}
          <div className="relative bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[360px]">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                onTimeUpdate={handleTimeUpdate}
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <div className="text-center p-12 text-slate-500">
                <Subtitles className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Hãy chọn một tệp video ở trên để bắt đầu xem.</p>
              </div>
            )}

            {/* Live Subtitle Banner Overlay */}
            {currentCue && (
              <div className="w-full bg-slate-950/90 border-t border-slate-800 p-4 text-center backdrop-blur-md animate-in fade-in">
                {/* Original text */}
                <div className="text-xs text-slate-400 font-mono italic">
                  {currentCue.text}
                </div>
                {/* Translated text */}
                <div className="text-base md:text-lg font-bold text-amber-300 mt-1">
                  {currentCue.translated || currentCue.text}
                </div>
              </div>
            )}
          </div>

          {/* Instant Translate Bar for quick word/sentence query */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center">
            <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Gặp từ hoặc câu tiếng Anh/Nhật/Hàn nào khó hiểu trong phim? Gõ vào đây để dịch ngay..."
              value={instantText}
              onChange={e => setInstantText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInstantTranslate()}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={handleInstantTranslate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Dịch Nhanh
            </button>
            {instantTrans && (
              <div className="text-xs font-bold text-emerald-400 font-mono px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {instantTrans}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TTS GENERATOR */}
      {activeTab === 'tts' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-pink-400" />
              Tạo Giọng Đọc AI Tự Nhiên (Edge-TTS)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Chuyển văn bản bài học hoặc kịch bản video thành giọng đọc mượt mà chuẩn phát thanh viên (Tiếng Việt Hoài My, Nam Minh, Tiếng Anh Jenny).
            </p>

            <form onSubmit={handleGenerateTTS} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Nhập nội dung văn bản cần đọc..."
                value={ttsText}
                onChange={e => setTtsText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none resize-none"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <select
                  value={ttsVoice}
                  onChange={e => setTtsVoice(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="vi-VN-HoaiMyNeural">Hoài My (Nữ - Truyền cảm, Bắc)</option>
                  <option value="vi-VN-NamMinhNeural">Nam Minh (Nam - Ấm áp, Bắc)</option>
                  <option value="en-US-JennyNeural">Jenny (Nữ - Tiếng Anh US chuẩn)</option>
                  <option value="en-US-GuyNeural">Guy (Nam - Tiếng Anh US chuẩn)</option>
                </select>

                <button
                  type="submit"
                  disabled={ttsLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{ttsLoading ? 'Đang tạo âm thanh...' : 'Chuyển Thành Giọng Đọc'}</span>
                </button>
              </div>
            </form>
          </div>

          {ttsResult && (
            <div className="bg-slate-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">File âm thanh đã sẵn sàng!</h4>
                <p className="text-xs text-slate-400 font-mono">{ttsResult.filename}</p>
                <audio src={ttsResult.audio_url} controls className="mt-2 h-9" />
              </div>

              <a
                href={ttsResult.audio_url}
                download
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Tải File MP3</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* 3. FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-pink-400" />
              Thẻ Ghi Nhớ Flashcard (Spaced Repetition)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Bấm vào thẻ để lật xem câu trả lời. Giúp ghi nhớ lâu cú pháp code, thuật ngữ, cấu trúc dữ liệu.
            </p>

            {/* Flashcard 3D Viewer */}
            {cards.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full max-w-md h-56 rounded-3xl p-8 border cursor-pointer select-none transition-all duration-300 flex flex-col items-center justify-center text-center shadow-2xl ${
                    isFlipped
                      ? 'bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 border-purple-500/40 text-purple-100'
                      : 'bg-gradient-to-tr from-slate-900 to-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-bold mb-2 text-slate-400">
                    {cards[cardIndex]?.deck_name} • {isFlipped ? 'Đáp án (Back)' : 'Câu hỏi (Front) - Bấm để lật'}
                  </span>
                  <div className="text-base md:text-lg font-bold leading-relaxed">
                    {isFlipped ? cards[cardIndex]?.back : cards[cardIndex]?.front}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={() => { setIsFlipped(false); setCardIndex((cardIndex - 1 + cards.length) % cards.length); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                  >
                    ← Thẻ trước
                  </button>
                  <span className="text-xs text-slate-400 font-mono">
                    {cardIndex + 1} / {cards.length}
                  </span>
                  <button
                    onClick={() => { setIsFlipped(false); setCardIndex((cardIndex + 1) % cards.length); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                  >
                    Thẻ tiếp →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Chưa có thẻ nào. Thêm thẻ mới ở bảng bên dưới!
              </div>
            )}
          </div>

          {/* Add New Card Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3">Thêm Thẻ Học Mới</h4>
            <form onSubmit={handleAddCard} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Chủ đề (ví dụ: Java OOP)"
                value={newCard.deck_name}
                onChange={e => setNewCard({ ...newCard, deck_name: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="Mặt trước (Khái niệm / Câu hỏi)"
                value={newCard.front}
                onChange={e => setNewCard({ ...newCard, front: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Mặt sau (Câu trả lời)"
                  value={newCard.back}
                  onChange={e => setNewCard({ ...newCard, back: e.target.value })}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. POMODORO */}
      {activeTab === 'pomodoro' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold">
            <Timer className="w-4 h-4" />
            <span>Phương Pháp Tập Trung Pomodoro</span>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setPomoMode('work'); setPomoTime(25 * 60); setPomoRunning(false); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pomoMode === 'work' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              25 Phút Tập Trung
            </button>
            <button
              onClick={() => { setPomoMode('break'); setPomoTime(5 * 60); setPomoRunning(false); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pomoMode === 'break' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              5 Phút Nghỉ Ngơi
            </button>
          </div>

          {/* Clock Display */}
          <div className="text-6xl md:text-7xl font-mono font-extrabold text-white tracking-wider my-4">
            {formatPomoTime()}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPomoRunning(!pomoRunning)}
              className="px-8 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-xl shadow-pink-600/30 flex items-center gap-2"
            >
              {pomoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{pomoRunning ? 'Tạm Dừng' : 'Bắt Đầu'}</span>
            </button>
            <button
              onClick={() => { setPomoRunning(false); setPomoTime(pomoMode === 'work' ? 25 * 60 : 5 * 60); }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. AI SUMMARIZE */}
      {activeTab === 'summarize' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-pink-400" />
              AI Tóm Tắt Slide & Tạo Câu Hỏi Ôn Thi
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Dán nội dung bài học hoặc đoạn văn bản giáo trình dài vào đây. Hệ thống sẽ trích xuất ý chính và tạo câu hỏi tự kiểm tra kiến thức.
            </p>

            <form onSubmit={handleSummarize} className="space-y-4">
              <textarea
                rows={5}
                required
                placeholder="Dán nội dung giáo trình, slide hoặc tài liệu bài giảng vào đây..."
                value={sumText}
                onChange={e => setSumText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs md:text-sm focus:border-pink-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                disabled={sumLoading}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900 text-white font-bold text-xs shadow-lg shadow-pink-600/30"
              >
                {sumLoading ? 'AI đang phân tích...' : 'Tóm Tắt & Sinh Câu Hỏi'}
              </button>
            </form>
          </div>

          {sumResult && (
            <div className="bg-slate-900 border border-pink-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in">
              <h4 className="font-bold text-sm text-pink-400 uppercase tracking-wider">
                Ý Chính Đã Rút Gọn ({sumResult.word_count} từ gốc):
              </h4>
              <ul className="space-y-2 text-xs text-slate-200">
                {sumResult.key_takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0"></span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {sumResult.generated_quiz && sumResult.generated_quiz.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wider mb-2">
                    Câu Hỏi Tự Ôn Tập Đề Xuất:
                  </h4>
                  <div className="space-y-2">
                    {sumResult.generated_quiz.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-300">
                        {q.question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
              : toast.type === 'success' || toast.type === 'pomo'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-indigo-950/50'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 hover:opacity-80 rounded-lg shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
