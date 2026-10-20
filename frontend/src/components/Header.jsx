import React, { useState } from 'react'
import {
  GraduationCap,
  Grid,
  Search,
  Moon,
  Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'

export default function Header({ currentTab, setCurrentTab, showDock, setShowDock, onOpenMobileDrawer }) {
  const [searchQuery, setSearchQuery] = useState('')
  const { currentUser, openAuthModal } = useAuth()

  const displayName = currentUser?.name || 'Redmi19052008'

  const searchItems = [
    { title: 'Bảng Điều Khiển Tổng Quan', tab: 'dashboard', keyword: 'tong quan dashboard gpa' },
    { title: 'Quản Lý Môn Học & Tính Điểm GPA', tab: 'academic', keyword: 'mon hoc diem so gpa tin chi' },
    { title: 'Ghi Chú, Lịch Trình & Deadline', tab: 'notes', keyword: 'ghi chu lich deadline note' },
    { title: 'Atlas Giải Phẫu Học 3D (Y Khoa)', tab: 'anatomy', keyword: 'giai phau 3d y khoa svitylo tim nao' },
    { title: 'Kho Tài Liệu & Tải File Trực Tuyến', tab: 'documents', keyword: 'tai lieu giao trinh de thi pdf' },
    { title: 'Phòng Lập Trình & Ôn Code (Java/C++)', tab: 'code', keyword: 'code java c++ python compiler lap trinh' },
    { title: 'Kho Giao Diện Web & UI Kit Studio', tab: 'uikit', keyword: 'ui kit giao dien web tailwind dark mode' },
    { title: 'Phòng Thí Nghiệm Animation 60 FPS', tab: 'animation', keyword: 'animation motion gsap framer animejs' },
    { title: 'Xưởng Sáng Tạo Media & Lách Trùng', tab: 'media', keyword: 'media video tiktok youtube tach nen nobg' },
    { title: 'Tiện Ích AI (Dịch Sub, TTS, Flashcard)', tab: 'smart', keyword: 'ai tien ich dich sub tts voice flashcard' },
    { title: 'WiFi Drop & Bắn Ảnh Không Dây', tab: 'mobile', keyword: 'wifi drop ban anh ban file p2p mobile' }
  ]

  const filtered = searchQuery.trim()
    ? searchItems.filter(i => (i.title + ' ' + i.keyword).toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
      {/* Search Bar (Centered / Left on Desktop) */}
      <div className="hidden md:flex relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tính năng, khóa học, tài liệu..."
          className="w-full pl-11 pr-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 shadow-inner transition-colors"
        />

        {/* Quick Search Dropdown */}
        {filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
            {filtered.map(item => (
              <button
                key={item.tab}
                onClick={() => {
                  setCurrentTab(item.tab)
                  setSearchQuery('')
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{item.title}</span>
                <span className="text-[10px] text-blue-400 font-mono">Đi tới →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile App Bar */}
      <div className="flex md:hidden items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-white tracking-tight">StudyMedia Hub</h2>
          <span className="text-[10px] text-blue-400 font-semibold">Personal Workstation</span>
        </div>
      </div>

      {/* Desktop Right Actions: Dark Mode, Notifications, User Profile */}
      <div className="hidden md:flex items-center gap-3">
        {/* Dark Mode Icon Button */}
        <button
          type="button"
          title="Chế độ tối (Dark Mode)"
          className="w-9 h-9 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Notification Bell Button with Red Dot */}
        <button
          type="button"
          title="Thông báo mới"
          className="relative w-9 h-9 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-slate-950" />
        </button>

        {/* User Account / Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/30 ring-1 ring-white/20 shrink-0">
              RE
            </div>
            <div className="leading-tight hidden lg:block">
              <div className="text-xs font-bold text-white tracking-tight">{displayName}</div>
              <div className="text-[10px] text-slate-400 font-medium">Học tập • Tài khoản</div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Top Actions */}
      <div className="flex md:hidden items-center gap-2">
        <UserMenu isMobile />
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Grid className="w-3.5 h-3.5 text-blue-400" />
          <span>Menu</span>
        </button>
      </div>
    </header>
  )
}
