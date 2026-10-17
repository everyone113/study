import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cloud,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Smartphone,
  KeyRound
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    authModalInitialTab,
    login,
    register,
    loginWithGoogle,
    importSyncToken
  } = useAuth()

  const [tab, setTab] = useState(authModalInitialTab || 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [migrateData, setMigrateData] = useState(true)

  // Custom Google prompt state
  const [showGooglePrompt, setShowGooglePrompt] = useState(false)
  const [googleCustomEmail, setGoogleCustomEmail] = useState('')
  const [googleCustomName, setGoogleCustomName] = useState('')

  // Sync token input state
  const [syncInput, setSyncInput] = useState('')

  if (!authModalOpen) return null

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      await login({ email, password })
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập không thành công.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegister = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setErrorMsg('Vui lòng điền họ tên, email và mật khẩu.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await register({
        name,
        email,
        password,
        studentId,
        migrateGuestData: migrateData
      })
      if (res?.success) {
        setSuccessMsg('Đăng ký thành công! Đang chuẩn bị không gian làm việc...')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Đăng ký không thành công.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleQuickSelect = async (gEmail, gName) => {
    setLoading(true)
    setErrorMsg('')
    try {
      await loginWithGoogle({
        email: gEmail,
        name: gName,
        migrateGuestData: migrateData
      })
    } catch (err) {
      setErrorMsg('Đăng nhập Google không thành công.')
    } finally {
      setLoading(false)
      setShowGooglePrompt(false)
    }
  }

  const handleGoogleCustomSubmit = async (e) => {
    e.preventDefault()
    if (!googleCustomEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail.')
      return
    }
    const cleanGName = googleCustomName.trim() || googleCustomEmail.split('@')[0]
    await handleGoogleQuickSelect(googleCustomEmail, cleanGName)
  }

  const handleSyncSubmit = (e) => {
    e.preventDefault()
    if (!syncInput.trim()) {
      setErrorMsg('Vui lòng dán mã đồng bộ hoặc đường link từ máy tính.')
      return
    }
    setLoading(true)
    setErrorMsg('')
    const res = importSyncToken(syncInput.trim())
    setLoading(false)
    if (res.success) {
      setSuccessMsg('🎉 Đồng bộ tài khoản thành công! Toàn bộ bảng điểm và ghi chú đã xuất hiện trên điện thoại.')
      setTimeout(() => closeAuthModal(), 1200)
    } else {
      setErrorMsg(res.message || 'Mã đồng bộ không hợp lệ. Vui lòng kiểm tra lại.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden"
        >
          {/* Header decorative glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Top Branding */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-2.5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {tab === 'login'
                  ? 'Đăng Nhập Tài Khoản'
                  : tab === 'register'
                  ? 'Đăng Ký Tài Khoản Mới'
                  : 'Đồng Bộ Từ Máy Tính'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Đồng bộ bảng điểm, ghi chú và tài liệu cá nhân đa thiết bị
              </p>
            </div>

            {/* Google Fast Sign-In Button */}
            {!showGooglePrompt ? (
              <button
                type="button"
                onClick={() => setShowGooglePrompt(true)}
                className="w-full mb-4 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Tiếp tục với Google (1-Click)</span>
              </button>
            ) : (
              /* Google Account Picker View */
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3.5 rounded-2xl bg-slate-800/90 border border-blue-500/40"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Chọn tài khoản Google</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGooglePrompt(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Quay lại
                  </button>
                </div>

                <form onSubmit={handleGoogleCustomSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    placeholder="ví dụ: tensinhvien@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={googleCustomName}
                    onChange={(e) => setGoogleCustomName(e.target.value)}
                    placeholder="Họ và tên hiển thị (tùy chọn)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30"
                  >
                    <span>Xác nhận kết nối Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3.5">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                hoặc phương thức khác
              </span>
            </div>

            {/* Tabs Switcher: 3 Tabs (Đăng Nhập, Đăng Ký, Đồng Bộ Máy Tính) */}
            <div className="flex rounded-xl bg-slate-800/80 p-1 mb-4 border border-slate-700/60">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đăng Ký
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('sync')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  tab === 'sync'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mã Máy Tính</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>{errorMsg}</div>
              </motion.div>
            )}

            {/* Success Message */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Tab 1: ĐĂNG NHẬP */}
            {tab === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@sinhvien.edu.vn"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                </button>

                {/* Helpful Hint for Phone Users */}
                <div className="mt-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300 leading-relaxed text-center">
                  💡 <strong>Đang dùng điện thoại?</strong> Hãy mở máy tính $\rightarrow$ bấm ảnh đại diện $\rightarrow$ <strong>"Đồng bộ sang Điện thoại"</strong> để quét mã QR đăng nhập trong 2 giây!
                </div>
              </form>
            )}

            {/* Tab 2: ĐĂNG KÝ */}
            {tab === 'register' && (
              <form onSubmit={handleEmailRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="a@gmail.com"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mã sinh viên</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="B21DCCN001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nhập lại</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={migrateData}
                    onChange={(e) => setMigrateData(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0 mt-0.5"
                  />
                  <span className="text-[11px] text-slate-300 leading-tight">
                    Đồng bộ dữ liệu học tập hiện tại trên máy vào tài khoản mới này
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Bật Đồng Bộ'}
                </button>
              </form>
            )}

            {/* Tab 3: ĐỒNG BỘ TỪ MÁY TÍNH (MÃ TOKEN HOẶC LINK) */}
            {tab === 'sync' && (
              <form onSubmit={handleSyncSubmit} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
                  📱 <strong>Nhập mã đồng bộ từ máy tính:</strong> Trên máy tính đã đăng nhập, bấm vào Avatar $\rightarrow$ chọn <strong>"Đồng bộ sang Điện thoại"</strong> $\rightarrow$ bấm <em>"Sao chép mã đồng bộ"</em> rồi dán vào ô bên dưới!
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dán mã đồng bộ hoặc đường link từ máy tính
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                    <textarea
                      value={syncInput}
                      onChange={(e) => setSyncInput(e.target.value)}
                      placeholder="Dán mã đồng bộ bắt đầu bằng eyJ... hoặc link https://... vào đây"
                      rows={3}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Kích Hoạt Đăng Nhập & Đồng Bộ Ngay</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-normal">
                  Hoặc bạn có thể mở <strong>Camera điện thoại</strong> quét trực tiếp mã QR trên màn hình máy tính để đăng nhập ngay mà không cần dán mã!
                </p>
              </form>
            )}

            {/* Cloud Sync Assurance */}
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Dữ liệu được mã hóa và gắn mã định danh cá nhân</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
