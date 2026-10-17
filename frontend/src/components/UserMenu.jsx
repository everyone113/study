import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  User,
  LogOut,
  Cloud,
  CheckCircle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Sparkles,
  Download,
  ChevronDown,
  QrCode,
  Smartphone,
  X,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UserMenu({ isMobile = false }) {
  const {
    currentUser,
    isGuest,
    openAuthModal,
    logout,
    syncStatus,
    lastSyncedAt,
    syncCloudData,
    generateSyncUrl,
    generateSyncToken
  } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [syncingLocal, setSyncingLocal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const menuRef = useRef(null)

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleCopyToken = () => {
    const token = generateSyncToken()
    if (token) {
      navigator.clipboard.writeText(token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2500)
    }
  }

  const handleManualSync = async () => {
    setSyncingLocal(true)
    await syncCloudData()
    setTimeout(() => setSyncingLocal(false), 800)
  }

  const handleExportBackup = () => {
    if (!currentUser) return
    const backupData = {
      user: currentUser,
      exportedAt: new Date().toISOString(),
      vault: {
        academic_subjects: localStorage.getItem(`studymedia_vault_${currentUser.id}_academic_subjects`),
        gpa_summary: localStorage.getItem(`studymedia_vault_${currentUser.id}_gpa_summary`),
        notes: localStorage.getItem(`studymedia_vault_${currentUser.id}_notes`),
        documents: localStorage.getItem(`studymedia_vault_${currentUser.id}_documents`),
        flashcards: localStorage.getItem(`studymedia_vault_${currentUser.id}_flashcards`)
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `StudyMediaHub_Backup_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Render Guest Button if not logged in
  if (isGuest) {
    return (
      <button
        onClick={() => openAuthModal('login')}
        className={`flex items-center gap-1.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
          isMobile
            ? 'px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold'
            : 'px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 ring-1 ring-white/20'
        }`}
      >
        <User className="w-3.5 h-3.5 shrink-0" />
        <span>{isMobile ? 'Đăng nhập' : 'Đăng Nhập / Google'}</span>
        {!isMobile && <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />}
      </button>
    )
  }

  const syncUrl = generateSyncUrl()

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white transition-all cursor-pointer shadow-sm select-none active:scale-98"
        >
          {/* User Avatar with Glowing Online Dot */}
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-xl object-cover ring-1 ring-blue-400/50 bg-slate-800"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>

          {/* User Info & Cloud Sync Indicator */}
          <div className="text-left hidden sm:block leading-tight">
            <div className="text-xs font-bold truncate max-w-[110px] text-white flex items-center gap-1">
              <span>{currentUser.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="font-mono text-cyan-400">#{currentUser.id.replace('usr_', '')}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Đã đồng bộ</span>
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* Profile Dropdown Card */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24 }}
              className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-700/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-4 z-50 ring-1 ring-white/10"
            >
              {/* Header info */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-2xl ring-2 ring-blue-500/50 object-cover"
                />
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  {currentUser.student_id && (
                    <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      MSSV: {currentUser.student_id}
                    </span>
                  )}
                </div>
              </div>

              {/* User ID copy row */}
              <div className="mt-3 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Mã định danh cá nhân
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400 truncate block max-w-[170px]">
                    {currentUser.id}
                  </span>
                </div>
                <button
                  onClick={handleCopyId}
                  title="Sao chép mã ID"
                  className="p-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Instant Cross-Device Sync Button (QR Code) */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setShowQrModal(true)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-600/30 transition-all font-semibold text-xs cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Đồng bộ sang Điện thoại</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                    Mã QR
                  </span>
                </button>
              </div>

              {/* Cloud Sync Status */}
              <div className="mt-3 p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-200 block">Đồng bộ đám mây</span>
                    <span className="text-[10px] text-slate-400">
                      {lastSyncedAt ? `Cập nhật ${lastSyncedAt}` : 'Sẵn sàng'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={syncingLocal || syncStatus === 'syncing'}
                  title="Đồng bộ ngay"
                  className="p-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingLocal ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Actions List */}
              <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                {/* Backup export */}
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sao lưu dữ liệu cá nhân (.json)</span>
                </button>

                {/* Switch account / Login another */}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    openAuthModal('login')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Đổi tài khoản khác</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Đăng xuất (Về chế độ Khách)</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cross-Device QR Synchronization Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-center ring-1 ring-white/10"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                Đồng Bộ Sang Điện Thoại
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Mở <strong className="text-emerald-400">Camera điện thoại</strong> hoặc ứng dụng <strong className="text-blue-400">Zalo</strong> quét mã QR này để tự động đăng nhập & chuyển toàn bộ dữ liệu ngay lập tức!
              </p>

              {/* QR Code Container */}
              <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-xl">
                {syncUrl ? (
                  <QRCodeSVG
                    value={syncUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="L"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-800 text-xs">
                    Đang tạo mã...
                  </div>
                )}
              </div>

              {/* Or Copy Token Link */}
              <div className="space-y-2">
                <button
                  onClick={handleCopyToken}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép mã đồng bộ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Sao chép mã đồng bộ (gửi qua tin nhắn)</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-4 leading-normal">
                Sau khi quét hoặc nhập mã trên điện thoại, toàn bộ bảng điểm GPA, lịch thi và tài liệu sẽ xuất hiện ngay!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
