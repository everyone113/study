import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import MindmapToolbar from '../components/mindmap/MindmapToolbar'
import MindmapCanvas from '../components/mindmap/MindmapCanvas'
import SoundscapePlayer from '../components/mindmap/SoundscapePlayer'
import GenerateModal from '../components/mindmap/GenerateModal'
import PresentationView from '../components/mindmap/PresentationView'
import {
  addChildNode,
  addSiblingNode,
  deleteNode,
  renameNode,
  updateNodeNotes,
  updateNodeColor,
  toggleCollapse,
  ROOT_COLOR,
  PALETTE,
  CANVAS_BOUNDS
} from '../utils/mindmapTreeUtils'
import {
  exportToPng,
  downloadSvgFile,
  exportToJson,
  exportToStudyMediaFlashcards
} from '../utils/exportUtils'
import { soundscapeEngine } from '../utils/soundscapeAudioEngine'

const DEFAULT_STARTER_TREE = {
  id: 'node-root',
  text: 'Xưởng Sơ Đồ Tư Duy & Trực Quan Hóa',
  color: ROOT_COLOR,
  isCollapsed: false,
  collapsed: false,
  notes: 'Sơ đồ tư duy tương tác StudyMediaHub. Nhấp đúp chuột để sửa hoặc bấm + để thêm nhánh.',
  children: [
    {
      id: 'node-b1',
      text: 'Kỹ thuật Lập trình',
      color: PALETTE[0],
      isCollapsed: false,
      collapsed: false,
      notes: 'Các môn học chuyên ngành công nghệ thông tin',
      children: [
        { id: 'node-b1-1', text: 'Cấu trúc Dữ liệu & Giải thuật', color: PALETTE[0], children: [] },
        { id: 'node-b1-2', text: 'Kiến trúc Máy tính & HĐH', color: PALETTE[0], children: [] },
        { id: 'node-b1-3', text: 'FastAPI & Async Python', color: PALETTE[0], children: [] }
      ]
    },
    {
      id: 'node-b2',
      text: 'Y Khoa & Dược Lý',
      color: PALETTE[1],
      isCollapsed: false,
      collapsed: false,
      notes: 'Phân hệ học tập giải phẫu & dược học',
      children: [
        { id: 'node-b2-1', text: 'Giải Phẫu Học 3D Svitylo', color: PALETTE[1], children: [] },
        { id: 'node-b2-2', text: 'Kháng sinh Beta-lactam & Macrolide', color: PALETTE[1], children: [] }
      ]
    },
    {
      id: 'node-b3',
      text: 'Âm Thanh & Tập Trung',
      color: PALETTE[2],
      isCollapsed: false,
      collapsed: false,
      notes: 'Focus Ambient Soundscapes procedural synthesis',
      children: [
        { id: 'node-b3-1', text: 'Sóng não Alpha 40Hz', color: PALETTE[2], children: [] },
        { id: 'node-b3-2', text: 'Mưa rơi & Bàn phím cơ', color: PALETTE[2], children: [] },
        { id: 'node-b3-3', text: 'Xuất Spaced Flashcards', color: PALETTE[2], children: [] }
      ]
    }
  ]
}

export default function MindmapStudioView({ setCurrentTab }) {
  const authContext = useAuth()
  const [mindmapsList, setMindmapsList] = useState([])
  const [currentMindmapId, setCurrentMindmapId] = useState(null)
  const [title, setTitle] = useState('Xưởng Sơ Đồ Tư Duy')
  const [rootNode, setRootNode] = useState(DEFAULT_STARTER_TREE)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'

  // Canvas Viewport Transforms
  const [zoom, setZoom] = useState(1.0)
  const [viewportTx, setViewportTx] = useState(80)
  const [viewportTy, setViewportTy] = useState(200)
  const resetViewCallback = useRef(null)

  // Modals & Panels
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showSoundscape, setShowSoundscape] = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const [isSoundscapePlaying, setIsSoundscapePlaying] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Toast helper
  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), duration)
  }

  // Soundscape engine listener
  useEffect(() => {
    const unsub = soundscapeEngine.subscribe((state) => {
      setIsSoundscapePlaying(state.isPlaying)
    })
    return () => unsub()
  }, [])

  // Load mindmaps list on mount
  const fetchMindmaps = useCallback(async () => {
    try {
      const res = await axios.get('/api/mindmap')
      if (res.data && Array.isArray(res.data)) {
        setMindmapsList(res.data)
        if (res.data.length > 0 && !currentMindmapId) {
          // Load first mindmap
          const first = res.data[0]
          loadMindmap(first.id)
        }
      }
    } catch (err) {
      console.warn('Backend mindmaps not reachable, falling back to local vault:', err.message)
      // Check local vault
      try {
        const local = localStorage.getItem('studymedia_vault_mindmaps')
        if (local) {
          const parsed = JSON.parse(local)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMindmapsList(parsed)
            setRootNode(parsed[0].root_node || DEFAULT_STARTER_TREE)
            setTitle(parsed[0].title || 'Sơ đồ tư duy')
            setCurrentMindmapId(parsed[0].id)
          }
        }
      } catch (e) {}
    }
  }, [currentMindmapId])

  useEffect(() => {
    fetchMindmaps()
  }, [fetchMindmaps])

  // Load a specific mindmap by ID
  const loadMindmap = async (id) => {
    try {
      const res = await axios.get(`/api/mindmap/${id}`)
      if (res.data) {
        const data = res.data
        setCurrentMindmapId(data.id)
        setTitle(data.title || 'Sơ đồ tư duy')
        const tree = data.root_node || data.root_data || DEFAULT_STARTER_TREE
        setRootNode(tree)
        setSelectedNodeId(null)
        setSaveStatus('saved')
        showToast(`Đã mở: ${data.title}`)
      }
    } catch (err) {
      console.error('Failed to load mindmap from backend:', err)
      showToast('Không thể tải sơ đồ từ máy chủ', 3000)
    }
  }

  // Save mindmap to backend (and fallback to localStorage)
  const saveMindmap = useCallback(async (currentTree = rootNode, currentTitle = title) => {
    setSaveStatus('saving')
    try {
      if (currentMindmapId) {
        // Update existing
        const res = await axios.put(`/api/mindmap/${currentMindmapId}`, {
          title: currentTitle,
          root_node: currentTree,
        })
        setSaveStatus('saved')
        fetchMindmaps()
        showToast('Đã lưu thay đổi vào cơ sở dữ liệu!')
      } else {
        // Create new
        const res = await axios.post('/api/mindmap', {
          title: currentTitle,
          root_node: currentTree,
          user_id: 'guest',
        })
        if (res.data && res.data.id) {
          setCurrentMindmapId(res.data.id)
        }
        setSaveStatus('saved')
        fetchMindmaps()
        showToast('Đã tạo và lưu sơ đồ mới thành công!')
      }

      // Sync to local vault
      try {
        const localData = {
          id: currentMindmapId || 'local_mm_' + Date.now(),
          title: currentTitle,
          root_node: currentTree,
          updated_at: new Date().toISOString()
        }
        localStorage.setItem('studymedia_vault_mindmaps', JSON.stringify([localData]))
      } catch (e) {}
    } catch (err) {
      console.error('Failed to save mindmap:', err)
      setSaveStatus('error')
      showToast('Lỗi lưu vào máy chủ (Đã lưu dự phòng cục bộ)', 3500)
    }
  }, [currentMindmapId, fetchMindmaps, rootNode, title])

  // Debounced Auto-save after changes
  const autoSaveTimeout = useRef(null)
  const triggerAutoSave = (updatedTree) => {
    setSaveStatus('saving')
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current)
    autoSaveTimeout.current = setTimeout(() => {
      saveMindmap(updatedTree, title)
    }, 1800)
  }

  // Tree Operations Handlers
  const handleAddChild = (parentId) => {
    const updated = addChildNode(rootNode, parentId, 'Ý tưởng con mới')
    setRootNode(updated)
    triggerAutoSave(updated)
  }

  const handleAddSibling = (targetId) => {
    const updated = addSiblingNode(rootNode, targetId, 'Nhánh cùng cấp mới')
    setRootNode(updated)
    triggerAutoSave(updated)
  }

  const handleDeleteNode = (targetId) => {
    try {
      const updated = deleteNode(rootNode, targetId)
      setRootNode(updated)
      if (selectedNodeId === targetId) setSelectedNodeId(null)
      triggerAutoSave(updated)
      showToast('Đã xóa nhánh')
    } catch (err) {
      showToast(err.message, 3000)
    }
  }

  const handleRenameNode = (targetId, newText) => {
    const updated = renameNode(rootNode, targetId, newText)
    setRootNode(updated)
    triggerAutoSave(updated)
  }

  const handleUpdateNotes = (targetId, notes) => {
    const updated = updateNodeNotes(rootNode, targetId, notes)
    setRootNode(updated)
    triggerAutoSave(updated)
    showToast('Đã cập nhật ghi chú')
  }

  const handleUpdateColor = (targetId, color) => {
    const updated = updateNodeColor(rootNode, targetId, color, true)
    setRootNode(updated)
    triggerAutoSave(updated)
  }

  const handleToggleCollapse = (targetId) => {
    const updated = toggleCollapse(rootNode, targetId)
    setRootNode(updated)
  }

  const handleNewMindmap = () => {
    const newTitle = 'Sơ đồ tư duy mới'
    const newTree = {
      id: 'node-root',
      text: newTitle,
      color: ROOT_COLOR,
      isCollapsed: false,
      collapsed: false,
      notes: '',
      children: [
        { id: 'node-sub-1', text: 'Nhánh 1', color: PALETTE[0], children: [] },
        { id: 'node-sub-2', text: 'Nhánh 2', color: PALETTE[1], children: [] }
      ]
    }
    setCurrentMindmapId(null)
    setTitle(newTitle)
    setRootNode(newTree)
    setSelectedNodeId(null)
    setSaveStatus('saved')
    if (resetViewCallback.current) resetViewCallback.current()
    showToast('Đã tạo trang sơ đồ mới!')
  }

  // Handle Generator Result
  const handleGenerated = (result) => {
    if (result.root_node) {
      setRootNode(result.root_node)
    }
    if (result.title) {
      setTitle(result.title)
    }
    if (result.id) {
      setCurrentMindmapId(result.id)
    }
    if (resetViewCallback.current) resetViewCallback.current()
    fetchMindmaps()
    showToast(`Đã tạo thành công: ${result.title}!`, 3500)
  }

  // Export Handlers
  const handleExportPng = async () => {
    showToast('Đang khởi tạo ảnh PNG Retina 2x...')
    try {
      await exportToPng(rootNode, `mindmap-${title.replace(/\s+/g, '_')}.png`)
      showToast('Đã tải xuống ảnh PNG thành công!')
    } catch (e) {
      console.error(e)
      showToast('Lỗi khi xuất ảnh PNG: ' + e.message)
    }
  }

  const handleExportSvg = () => {
    downloadSvgFile(rootNode, `mindmap-${title.replace(/\s+/g, '_')}.svg`)
    showToast('Đã tải file Vector SVG thành công!')
  }

  const handleExportJson = () => {
    const doc = {
      title,
      root_node: rootNode,
      created_at: new Date().toISOString(),
      version: '1.0'
    }
    exportToJson(doc, `mindmap-${title.replace(/\s+/g, '_')}.json`)
    showToast('Đã tải xuống file JSON sao lưu!')
  }

  const handleExportFlashcards = async () => {
    showToast('Đang xuất sang Flashcards Vault...')
    try {
      const res = await exportToStudyMediaFlashcards(rootNode, `Mindmap: ${title}`, authContext)
      showToast(`Đã xuất thành công ${res.count} thẻ ghi nhớ sang Flashcards!`, 4000)
    } catch (e) {
      showToast('Lỗi khi xuất thẻ flashcards: ' + e.message)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950 text-slate-100 relative">
      {/* Top Toolbar */}
      <MindmapToolbar
        title={title}
        onRenameTitle={(newT) => {
          setTitle(newT)
          saveMindmap(rootNode, newT)
        }}
        saveStatus={saveStatus}
        onSave={() => saveMindmap(rootNode, title)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(CANVAS_BOUNDS.MAX_ZOOM, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(CANVAS_BOUNDS.MIN_ZOOM, z * 0.85))}
        onResetView={() => {
          if (resetViewCallback.current) resetViewCallback.current()
        }}
        onAutoLayout={() => {
          if (resetViewCallback.current) resetViewCallback.current()
          showToast('Đã căn chỉnh bố cục tự động')
        }}
        onNewMindmap={handleNewMindmap}
        onOpenGenerateModal={() => setShowGenerateModal(true)}
        onToggleSoundscape={() => setShowSoundscape(!showSoundscape)}
        isSoundscapeActive={isSoundscapePlaying}
        onStartPresentation={() => setShowPresentation(true)}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onExportFlashcards={handleExportFlashcards}
        mindmapsList={mindmapsList}
        onSelectMindmap={loadMindmap}
        currentMindmapId={currentMindmapId}
      />

      {/* Main Interactive Canvas */}
      <MindmapCanvas
        rootNode={rootNode}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        onDeleteNode={handleDeleteNode}
        onRenameNode={handleRenameNode}
        onUpdateNotes={handleUpdateNotes}
        onUpdateColor={handleUpdateColor}
        onToggleCollapse={handleToggleCollapse}
        zoom={zoom}
        setZoom={setZoom}
        viewportTx={viewportTx}
        setViewportTx={setViewportTx}
        viewportTy={viewportTy}
        setViewportTy={setViewportTy}
        onResetViewCallback={resetViewCallback}
      />

      {/* Soundscape Floating Mixer */}
      <SoundscapePlayer
        isOpen={showSoundscape}
        onClose={() => setShowSoundscape(false)}
      />

      {/* AI Generate Mindmap Modal */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerated={handleGenerated}
      />

      {/* Fullscreen Presentation Mode */}
      <PresentationView
        rootNode={rootNode}
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
      />

      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-slate-700 text-white text-xs font-bold shadow-2xl backdrop-blur-xl ring-1 ring-white/10 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
