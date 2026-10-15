import React, { useState } from 'react'
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

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />
      case 'academic':
        return <AcademicDashboard />
      case 'notes':
        return <NotesSchedule />
      case 'documents':
        return <DocumentLibrary />
      case 'code':
        return <CodePlayground />
      case 'media':
        return <MediaStudio />
      case 'smart':
        return <SmartUtilities />
      case 'mobile':
        return <MobileConnect />
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />
    }
  }

  return (
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
  )
}
