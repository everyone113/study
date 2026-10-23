import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  GraduationCap,
  CalendarCheck,
  HeartPulse,
  FileDown,
  Terminal,
  Layout,
  Flame,
  Video,
  Sparkles,
  QrCode,
  Grid,
  X,
  Search,
  ChevronRight,
  CheckCircle2,
  HardDrive,
  Network
} from 'lucide-react'
import { NAV_ITEMS } from './Sidebar'

export default function MobileNav({
  currentTab,
  setCurrentTab,
  drawerOpen,
  setDrawerOpen
}) {
  const [searchFilter, setSearchFilter] = useState('')

  // Determine current active section for contextual pill bar
  const isStudyTab = ['academic', 'notes', 'anatomy', 'documents', 'mindmap'].includes(currentTab)
  const isCreativeTab = ['uikit', 'animation', 'media', 'smart', 'mobile'].includes(currentTab)

  // Primary 5 Bottom Tabs
  const bottomTabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Layers,
      color: 'text-sky-400',
      isActive: currentTab === 'dashboard',
      action: () => setCurrentTab('dashboard')
    },
    {
      id: 'academic',
      label: 'Học tập',
      icon: GraduationCap,
      color: 'text-emerald-400',
      isActive: isStudyTab,
      action: () => setCurrentTab(isStudyTab ? currentTab : 'academic')
    },
    {
      id: 'code',
      label: 'Code',
      icon: Terminal,
      color: 'text-amber-400',
      isActive: currentTab === 'code',
      action: () => setCurrentTab('code')
    },
    {
      id: 'creative',
      label: 'Sáng tạo',
      icon: Sparkles,
      color: 'text-fuchsia-400',
      isActive: isCreativeTab,
      action: () => setCurrentTab(isCreativeTab ? currentTab : 'uikit')
    },
    {
      id: 'menu',
      label: 'Tất cả',
      icon: Grid,
      color: 'text-blue-400',
      badge: '11',
      isActive: drawerOpen,
      action: () => setDrawerOpen(prev => !prev)
    }
  ]

  // Filtered items in the drawer
  const filteredNavItems = useMemo(() => {
    if (!searchFilter.trim()) return NAV_ITEMS
    const q = searchFilter.toLowerCase()
    return NAV_ITEMS.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.shortLabel && item.shortLabel.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    )
  }, [searchFilter])

  const studyGroup = filteredNavItems.filter(i => i.category === 'study')
  const creativeGroup = filteredNavItems.filter(i => i.category === 'media')

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. CONTEXTUAL SUB-CATEGORY QUICK PILL BAR (MOBILE ONLY)                    */}
      {/* ========================================================================= */}
      {(isStudyTab || isCreativeTab) && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 px-3 py-1.5 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {isStudyTab && (
            <>
              {[
                { id: 'academic', label: 'Điểm GPA', icon: GraduationCap, color: 'text-emerald-400' },
                { id: 'notes', label: 'Lịch & Deadline', icon: CalendarCheck, color: 'text-indigo-400' },
                { id: 'anatomy', label: 'Giải Phẫu 3D', icon: HeartPulse, color: 'text-rose-400' },
                { id: 'documents', label: 'Kho Tài Liệu', icon: FileDown, color: 'text-cyan-400' },
                { id: 'mindmap', label: 'Sơ Đồ Mindmap', icon: Network, color: 'text-violet-400' }
              ].map(sub => {
                const SubIcon = sub.icon
                const isActive = currentTab === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : sub.color}`} />
                    <span>{sub.label}</span>
                  </button>
                )
              })}
            </>
          )}

          {isCreativeTab && (
            <>
              {[
                { id: 'uikit', label: 'Kho Giao Diện', icon: Layout, color: 'text-fuchsia-400' },
                { id: 'animation', label: 'Animation FX', icon: Flame, color: 'text-orange-400' },
                { id: 'media', label: 'Xưởng Media', icon: Video, color: 'text-purple-400' },
                { id: 'smart', label: 'Tiện Ích AI', icon: Sparkles, color: 'text-yellow-400' },
                { id: 'mobile', label: 'WiFi Drop', icon: QrCode, color: 'text-teal-400' }
              ].map(sub => {
                const SubIcon = sub.icon
                const isActive = currentTab === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : sub.color}`} />
                    <span>{sub.label}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ERGONOMIC 5-TAB BOTTOM NAVIGATION BAR (THUMB OPTIMIZED)                 */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl px-1.5 py-1.5 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.5)] safe-area-bottom">
        {bottomTabs.map(tab => {
          const Icon = tab.icon
          const isActive = tab.isActive
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 cursor-pointer relative active:scale-95 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.color}`} />

                {/* Badge on Menu tab */}
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-white' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </span>

              {/* Indicator dot under active tab */}
              {isActive && (
                <motion.span
                  layoutId="mobileActiveIndicator"
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5 shadow-sm shadow-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE FEATURE HUB (SWIPEABLE BOTTOM SHEET / DRAWER)                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Bottom Sheet Modal with Spring Physics */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 200 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setDrawerOpen(false)
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative z-10 bg-slate-900 border-t border-slate-700/80 rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Drag Handle Bar */}
              <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
              </div>

              {/* Drawer Header */}
              <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                    <span>Khám Phá Tính Năng</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      11 Công Cụ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Chạm để chuyển nhanh sang bất kỳ chuyên mục nào</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Tìm nhanh: GPA, 3D, code, wifi, media..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Feature List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
                {/* Group 1: Study & Academics */}
                {studyGroup.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
                      Học Tập, Y Khoa & Lập Trình
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {studyGroup.map(item => {
                        const Icon = item.icon
                        const isActive = currentTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id)
                              setDrawerOpen(false)
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                              isActive
                                ? 'bg-blue-600/15 border-blue-500/50 text-white'
                                : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="leading-tight">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{item.label}</span>
                                  {item.badge && (
                                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${item.badgeStyle}`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Group 2: Creative & AI Media */}
                {creativeGroup.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
                      Sáng Tạo, AI & Tiện Ích Media
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {creativeGroup.map(item => {
                        const Icon = item.icon
                        const isActive = currentTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id)
                              setDrawerOpen(false)
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                              isActive
                                ? 'bg-purple-600/15 border-purple-500/50 text-white'
                                : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="leading-tight">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{item.label}</span>
                                  {item.badge && (
                                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${item.badgeStyle}`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-600'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* System Status Footer in Drawer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>FastAPI & Ổ D: Ready</span>
                  </span>
                  <span className="font-mono text-[10px]">StudyMedia v1.2</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
