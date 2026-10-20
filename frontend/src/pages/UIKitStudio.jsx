import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import LucideIconExplorer from '../components/LucideIconExplorer'
import {
  Layout,
  Layers,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Sliders,
  Search,
  Star,
  User,
  Copy,
  Check,
  Code2,
  TrendingUp,
  Bell,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bookmark,
  Download,
  Share2,
  Terminal,
  ExternalLink,
  ChevronRight,
  X,
  Plus,
  Eye,
  CheckCircle
} from 'lucide-react'

export default function UIKitStudio() {
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'lucide' | 'hero' | 'cards' | 'pricing' | 'forms' | 'navigation'
  const [billingCycle, setBillingCycle] = useState('yearly') // 'monthly' | 'yearly'
  const [selectedCode, setSelectedCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [liveToast, setLiveToast] = useState(null)
  const [toggleState, setToggleState] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const triggerToast = (type, title, msg) => {
    setLiveToast({ type, title, msg })
    setTimeout(() => setLiveToast(null), 3500)
  }

  const triggerSuccessCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    })
  }

  const categories = [
    { id: 'all', label: 'Tất Cả Giao Diện', count: '10+' },
    { id: 'lucide', label: 'Biểu Tượng Lucide Icons', count: '1000+' },
    { id: 'hero', label: 'Hero & Banner', count: '2' },
    { id: 'cards', label: 'Thẻ & Bento Grid', count: '4' },
    { id: 'pricing', label: 'Bảng Giá & Gói Dịch Vụ', count: '1' },
    { id: 'forms', label: 'Form & Input Thông Minh', count: '3' },
    { id: 'navigation', label: 'Thanh Điều Hướng & Đảo Nổi', count: '2' },
  ]

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/50 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Layout className="w-3.5 h-3.5" />
              <span>Thư Viện UI Kit • Chuẩn Thiết Kế Cao Cấp</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Kho Giao Diện & Mẫu Thành Phần Web
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Tuyển tập các mẫu giao diện web hiện đại bậc nhất theo phong cách <strong>Dark Mode, Glassmorphism, Bento Grid & Apple Aesthetic</strong>. Mọi thành phần đều tương tác trực tiếp và hỗ trợ <strong>1-Click Copy Code</strong> sẵn dùng với Tailwind CSS & React.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerToast('success', 'Đã lưu mẫu', 'Bạn có thể xem và sao chép mã nguồn bất cứ lúc nào.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Test Toast Thông Báo</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Stats */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng tích hợp: <strong>100% Tailwind CSS</strong>, Responsive chuẩn Mobile & Desktop</span>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Lọc giao diện (hero, card, pricing...)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="uiCategoryPill"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {cat.count}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* 0. LUCIDE ICONS STUDIO                                                    */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'lucide') && (
        <section className="space-y-4">
          <LucideIconExplorer />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTIONS                                                          */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'hero') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">1. Hero Banner Hiện Đại (SaaS & Landing Page)</h2>
                <p className="text-xs text-slate-400">Khung tiêu đề trang chủ với thẻ điểm số nổi và nút hành động CTA</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCode({
                  title: 'Hero Banner: SaaS Dark Mode with Floating Badges',
                  code: `<div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 text-center overflow-hidden">\n  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">\n    <Sparkles className="w-3.5 h-3.5" />\n    <span>Nền tảng học tập thế hệ mới</span>\n  </div>\n  <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4">\n    Học Tập Thông Minh Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI & Trực Quan</span>\n  </h1>\n  <p className="text-slate-400 text-sm max-w-xl mx-auto mt-3">\n    Quản lý môn học, tính GPA tự động, giải phẫu học 3D và thư viện tài liệu thông minh.\n  </p>\n</div>`
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Xem Code Hero</span>
            </button>
          </div>

          {/* Interactive Hero Component */}
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 overflow-hidden shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Nền tảng Học tập & Workstation Cá nhân 2026</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Chinh Phục Điểm Số Với <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                  Kho Tri Thức Trực Quan
                </span>
              </h2>

              <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Tích hợp công nghệ giải phẫu 3D Svitylo, phòng lập trình Java/C++, theo dõi GPA hệ 4.0 và chuyển file không dây WiFi Drop.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={triggerSuccessCelebration}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Bắt Đầu Miễn Phí</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => triggerToast('info', 'Xem Giới Thiệu', 'Đang phát video hướng dẫn chi tiết các tính năng...')}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-semibold text-xs md:text-sm transition-all hover:text-white cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Demo Trực Tiếp</span>
                </button>
              </div>

              {/* Metrics Social Proof */}
              <div className="pt-8 border-t border-slate-800/60 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div>
                  <div className="text-xl md:text-2xl font-black text-white">3.92</div>
                  <div className="text-[11px] text-slate-500 font-medium">GPA Mục Tiêu</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-black text-white">100%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Bảo Mật Cục Bộ</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-black text-white">60 FPS</div>
                  <div className="text-[11px] text-slate-500 font-medium">Tốc Độ Phản Hồi</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. PRICING & SUBSCRIPTION CARDS                                           */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'pricing') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">2. Bảng Giá & Gói Dịch Vụ (Pricing Tiers)</h2>
                <p className="text-xs text-slate-400">Bảng giá 3 cấp độ với nút chuyển đổi Theo Tháng / Theo Năm (-20%)</p>
              </div>
            </div>

            {/* Billing Switch */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hàng Tháng
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Hàng Năm</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free Plan */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Khởi Đầu (Free)</h3>
                  <p className="text-xs text-slate-400 mt-1">Dành cho sinh viên tự học cơ bản</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">0đ</span>
                  <span className="text-xs text-slate-500">/ mãi mãi</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Quản lý tối đa 10 môn học</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Atlas giải phẫu 3D cơ bản</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Lưu trữ 50MB tài liệu</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => triggerToast('info', 'Gói Miễn Phí', 'Bạn đang sử dụng gói Miễn phí mặc định.')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Gói Hiện Tại
              </button>
            </div>

            {/* Pro Sinh Viên (Popular Glow Card) */}
            <div className="relative rounded-3xl p-0.5 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-sm" />
              <div className="relative rounded-[22px] bg-slate-900 p-6 flex flex-col justify-between space-y-6 h-full border border-blue-500/40">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white">
                      Phổ Biến Nhất
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Pro Sinh Viên</h3>
                    <p className="text-xs text-slate-400 mt-1">Toàn quyền tính GPA, Code và WiFi Drop</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {billingCycle === 'yearly' ? '39.000đ' : '49.000đ'}
                    </span>
                    <span className="text-xs text-slate-400">/ tháng</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Không giới hạn môn học & GPA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Trọn bộ mô hình giải phẫu 3D 4K</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Biên dịch & chạy code Java, C++</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>WiFi Drop bắn file PC & Điện thoại</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={triggerSuccessCelebration}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Nâng Cấp Ngay
                </button>
              </div>
            </div>

            {/* Unlimited Research */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Nghiên Cứu (Lab)</h3>
                  <p className="text-xs text-slate-400 mt-1">Dành cho nhóm đồ án & học viên cao học</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === 'yearly' ? '99.000đ' : '129.000đ'}
                  </span>
                  <span className="text-xs text-slate-500">/ tháng</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Toàn bộ quyền lợi gói Pro Sinh Viên</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Lách trùng lặp video & ảnh tự động</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dịch phụ đề video thời gian thực (AI)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => triggerToast('info', 'Gói Lab', 'Đã lưu thông tin tư vấn gói Nghiên cứu.')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Đăng Ký Tư Vấn
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. BENTO GRID & ADVANCED CARDS                                             */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'cards') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">3. Bento Grid & Thẻ Thông Tin Tương Tác</h2>
                <p className="text-xs text-slate-400">Bố cục lưới Bento hiện đại kết hợp dữ liệu thống kê, huy hiệu và đánh giá</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCode({
                  title: 'Bento Grid 4-Cell Layout',
                  code: `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n  <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800">\n    <h3>Thẻ Lớn (Span 2)</h3>\n  </div>\n  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">\n    <h3>Thẻ Nhỏ</h3>\n  </div>\n</div>`
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Xem Code Bento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1: Student Profile Glass Card */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                      SV
                    </div>
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Nguyễn Hoàng Long</span>
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                    </h4>
                    <p className="text-xs text-slate-400">B21DCCN042 • CNTT K21</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Tiến độ kỳ học:</span>
                    <span className="text-blue-400 font-bold">85% Hoàn thành</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="w-[85%] h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold">Java 21</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">GPA 3.85</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-semibold">Giải Phẫu 3D</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Đã kích hoạt bảo mật 2 lớp</span>
                <button
                  onClick={() => triggerToast('info', 'Hồ sơ', 'Xem chi tiết bảng điểm cá nhân.')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Xem hồ sơ →
                </button>
              </div>
            </div>

            {/* Bento Card 2: Interactive Course Document Card */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300">
                    PDF EBOOK
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9 (128)</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white">
                  Giáo Trình Triết Học Mác - Lênin (Chuẩn 2026)
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  Đầy đủ 3 chương, phân tích quy luật mâu thuẫn, lượng - chất và nhận thức luận duy vật biện chứng.
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span>14.2 MB</span>
                  <span>•</span>
                  <span>324 Trang</span>
                  <span>•</span>
                  <span className="text-emerald-400">Miễn phí</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => triggerToast('success', 'Tải Về', 'Bắt đầu tải file Giáo trình Triết học...')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về Ngay</span>
                </button>
                <button
                  onClick={() => triggerToast('info', 'Lưu Trữ', 'Đã thêm giáo trình vào mục yêu thích.')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bento Card 3: Real-time Stat Widget */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Hiệu Suất Ôn Thi
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% tuần này</span>
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black text-white">42.5h</span>
                  <span className="text-xs text-slate-500">thời gian tập trung</span>
                </div>

                {/* Mini Bar Chart Preview */}
                <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
                  {[40, 65, 30, 85, 95, 75, 90].map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        style={{ height: `${h}%` }}
                        className={`w-full rounded-md transition-all ${
                          idx === 4 ? 'bg-blue-500 shadow-md shadow-blue-500/40' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      />
                      <span className="text-[9px] text-slate-500 font-mono">T{idx + 2}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Mục tiêu tuần: 50h</span>
                <span className="text-blue-400 font-bold">Còn 7.5h</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. FORMS & SMART INPUTS                                                    */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'forms') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">4. Form & Thành Phần Nhập Liệu Thông Minh</h2>
                <p className="text-xs text-slate-400">Thanh tìm kiếm phím tắt Command Palette, nút gạt Switch và thẻ chọn Radio</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCode({
                  title: 'Command Palette Search Input with Shortcut Badge',
                  code: `<div className="relative">\n  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />\n  <input\n    type="text"\n    placeholder="Tìm kiếm môn học, tài liệu..."\n    className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"\n  />\n  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">\n    Ctrl K\n  </kbd>\n</div>`
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Xem Code Form</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Demo 1: Command Palette Search */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white">Thanh Tìm Kiếm Phím Tắt (Command Palette)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hỗ trợ phím tắt và gợi ý từ khóa nhanh</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Gõ để tìm kiếm bài giảng, mã môn học, tài liệu..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 shadow-sm">
                    Ctrl + K
                  </kbd>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Từ khóa gợi ý:</span>
                {['Giải Phẫu 3D', 'Triết Học', 'Java OOP', 'Lịch Thi'].map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => triggerToast('info', 'Tìm kiếm', `Đang tìm kiếm từ khóa "${tag}"...`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Demo 2: Interactive Switch Toggle & Radio Cards */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Nút Bật/Tắt Cài Đặt (Switch Toggle)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Công tắc gạt đồng bộ trạng thái tức thì</p>
                </div>
                {/* Switch */}
                <button
                  type="button"
                  onClick={() => setToggleState(!toggleState)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    toggleState ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      toggleState ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300">Thông báo nhắc lịch thi & hạn nộp bài tập</span>
                <span className={`font-bold ${toggleState ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {toggleState ? 'Đang Bật' : 'Đã Tắt'}
                </span>
              </div>

              {/* Radio Selection Cards */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {['Tiêu Chuẩn', 'Nâng Cao'].map((mode, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerToast('success', 'Chế Độ', `Đã chuyển sang chế độ: ${mode}`)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-blue-500 text-left transition-colors cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">{mode}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tự động tối ưu giao diện</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. FLOATING ISLAND NAVIGATION                                             */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'navigation') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">5. Đảo Nổi Điều Hướng (Floating Island Navbar)</h2>
                <p className="text-xs text-slate-400">Thanh điều hướng lơ lửng phong cách Dynamic Island của Apple</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCode({
                  title: 'Apple-style Floating Dock Island Navigation',
                  code: `<nav className="inline-flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">\n  <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors">\n    <Home className="w-4 h-4" />\n  </button>\n  <button className="p-2 rounded-xl bg-blue-600 text-white shadow-md">\n    <BookOpen className="w-4 h-4" />\n  </button>\n</nav>`
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Xem Code Dock</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Thử nghiệm Đảo Nổi (Floating Dock)</h3>
              <p className="text-xs text-slate-400">Rê chuột lên các biểu tượng để kiểm tra hiệu ứng phóng to mượt mà</p>
            </div>

            {/* Floating Island Dock */}
            <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl">
              {[
                { label: 'Tổng Quan', icon: Layout, active: true },
                { label: 'Giải Phẫu', icon: Zap, active: false },
                { label: 'Lập Trình', icon: Terminal, active: false },
                { label: 'Tài Liệu', icon: Download, active: false },
                { label: 'Cài Đặt', icon: Sliders, active: false },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <button
                    key={idx}
                    onClick={() => triggerToast('info', item.label, `Bạn đã chọn chuyển sang: ${item.label}`)}
                    className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer relative group ${
                      item.active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {/* Tooltip on hover */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CODE VIEW MODAL                                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedCode.title}</h3>
                    <p className="text-xs text-slate-400">Mã nguồn Tailwind CSS & React JSX</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {/* Code display */}
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 border border-slate-800/80">
                  {selectedCode.code}
                </pre>
                <button
                  onClick={() => handleCopyCode(selectedCode.code)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Toast Component */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className={`p-2 rounded-xl ${liveToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-bold text-white">{liveToast.title}</h5>
              <p className="text-[11px] text-slate-400 leading-snug">{liveToast.msg}</p>
            </div>
            <button onClick={() => setLiveToast(null)} className="text-slate-500 hover:text-slate-300 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
