import React, { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MobileNav from './components/MobileNav'

// Pages
import Dashboard from './pages/Dashboard'
import AcademicDashboard from './pages/AcademicDashboard'
import NotesSchedule from './pages/NotesSchedule'
import DocumentLibrary from './pages/DocumentLibrary'
import CodePlayground from './pages/CodePlayground'
import MediaStudio from './pages/MediaStudio'
import SmartUtilities from './pages/SmartUtilities'
import MobileConnect from './pages/MobileConnect'
import AnatomyAtlas from './pages/AnatomyAtlas'
import AnimationLab from './pages/AnimationLab'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudyMediaHub UI Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Đã có sự cố hiển thị giao diện</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Hệ thống phát hiện lỗi khi hiển thị thành phần. Dữ liệu của bạn vẫn an toàn trong bộ nhớ.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tải lại trang</span>
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('studymedia_gpa_summary')
                } catch (e) {}
                window.location.href = '/'
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Làm mới trang chủ
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('mode') === 'drop') return 'mobile'
      const tab = params.get('tab')
      if (tab) return tab
    } catch (e) {}
    return 'dashboard'
  })

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />
      case 'academic':
        return <AcademicDashboard />
      case 'notes':
        return <NotesSchedule />
      case 'anatomy':
        return <AnatomyAtlas setCurrentTab={setCurrentTab} />
      case 'documents':
        return <DocumentLibrary />
      case 'code':
        return <CodePlayground />
      case 'animation':
        return <AnimationLab />
      case 'media':
        return <MediaStudio />
      case 'smart':
        return <SmartUtilities />
      case 'mobile':
        return <MobileConnect setCurrentTab={setCurrentTab} />
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            {renderContent()}
          </main>

          {/* Mobile Navigation */}
          <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
