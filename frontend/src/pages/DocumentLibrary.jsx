import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
  FileDown,
  Globe,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle,
  AlertCircle,
  File,
  Search,
  Sparkles,
  BookOpen,
  HardDrive,
  Filter,
  Check,
  X,
  FileCode,
  FileSpreadsheet
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Safe file name extractor (OpenHands pattern: workspace-upload-path.ts)
export function getSafeUploadFileName(fileName) {
  if (!fileName) return `tailieu_${Date.now()}`
  const parts = fileName.split(/[\\/]+/).filter(Boolean)
  const safeName = parts[parts.length - 1]
  if (!safeName || safeName === '.' || safeName === '..') {
    return `tailieu_${Date.now()}`
  }
  return safeName
}

// Format file size safely
export function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Determine file category
export function getDocumentType(filename = '', mimeType = '') {
  const ext = (filename || '').split('.').pop().toLowerCase()
  if (['pdf'].includes(ext) || mimeType.includes('pdf')) return 'PDF'
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) return 'DOCX'
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation')) return 'PPTX'
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('sheet')) return 'EXCEL'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ZIP'
  if (['java', 'cpp', 'c', 'py', 'js', 'html', 'css'].includes(ext)) return 'CODE'
  if (['txt', 'md'].includes(ext)) return 'TXT'
  return ext.toUpperCase() || 'FILE'
}

// Default educational sample documents
const DEFAULT_STUDY_DOCS = [
  {
    id: 'doc_sample_1',
    title: 'Giáo Trình Triết Học Mác - Lênin (Trọng Tâm & Ôn Tập)',
    filename: 'GiaoTrinh_TrietHoc_MacLenin_2026.pdf',
    file_path: 'https://vi.wikipedia.org/wiki/Tri%E1%BA%BFt_h%E1%BB%8Dc_M%C3%A1c_-_L%C3%AAnin',
    file_size: 4850000,
    file_type: 'PDF',
    source_url: 'https://vi.wikipedia.org/wiki/Tri%E1%BA%BFt_h%E1%BB%8Dc_M%C3%A1c_-_L%C3%AAnin',
    subject_name: 'Triết Học Mác - Lênin',
    subject_code: 'PHI101',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc_sample_2',
    title: 'Cẩm Nang Thuật Ngữ Giải Phẫu Học Y Khoa (Song Ngữ VN - Latin)',
    filename: 'Anatomy_Atlas_Handbook_Bilingual.pdf',
    file_path: '/atlas/index.html',
    file_size: 3200000,
    file_type: 'PDF',
    source_url: '/atlas/index.html',
    subject_name: 'Giải Phẫu Học Y Khoa',
    subject_code: 'MED102',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc_sample_3',
    title: 'Tổng Hợp Cú Pháp & Thuật Toán Java Core / C++ 21',
    filename: 'Java_CPP_CheatSheet_Algorithms.pdf',
    file_path: 'https://docs.oracle.com/en/java/',
    file_size: 2150000,
    file_type: 'CODE',
    source_url: 'https://docs.oracle.com/en/java/',
    subject_name: 'Lập Trình Hướng Đối Tượng',
    subject_code: 'CS201',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc_sample_4',
    title: 'Quy Chế Đào Tạo & Cách Tính Điểm Tín Chỉ GPA Chuẩn',
    filename: 'QuyChe_DaoTao_TinChi_GPA.pdf',
    file_path: '#',
    file_size: 1420000,
    file_type: 'PDF',
    source_url: '',
    subject_name: 'Quy Chế Sinh Viên',
    subject_code: 'GEN100',
    created_at: new Date().toISOString()
  }
]

const LOCAL_DOCS_KEY = 'studymedia_academic_documents'

function getLocalDocuments() {
  try {
    const raw = localStorage.getItem(LOCAL_DOCS_KEY)
    if (!raw) return DEFAULT_STUDY_DOCS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STUDY_DOCS
  } catch (e) {
    return DEFAULT_STUDY_DOCS
  }
}

export default function DocumentLibrary() {
  const { getVaultItem, setVaultItem, currentUser, activeUserId, syncCloudData } = useAuth()

  // Always initialize with guaranteed array from user-isolated vault
  const [documents, setDocuments] = useState(() => {
    return getVaultItem('documents', DEFAULT_STUDY_DOCS)
  })
  const [subjects, setSubjects] = useState(() => {
    return getVaultItem('academic_subjects', [])
  })

  // Reload state automatically when switching user accounts
  useEffect(() => {
    const handleUserChanged = () => {
      setDocuments(getVaultItem('documents', DEFAULT_STUDY_DOCS))
      setSubjects(getVaultItem('academic_subjects', []))
    }
    window.addEventListener('studymedia:user_changed', handleUserChanged)
    return () => window.removeEventListener('studymedia:user_changed', handleUserChanged)
  }, [getVaultItem])

  const persistLocalDocuments = (docs) => {
    setDocuments(docs)
    setVaultItem('documents', docs)
    if (currentUser) {
      setTimeout(() => syncCloudData(), 1200)
    }
  }

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL' | 'PDF' | 'DOCX' | 'PPTX' | 'CODE'
  const [activeTab, setActiveTab] = useState('url') // 'url' or 'upload'

  // URL downloader form
  const [urlForm, setUrlForm] = useState({
    title: '',
    url: '',
    subject_id: ''
  })

  // File upload form
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSubjectId, setUploadSubjectId] = useState('')

  // Notification Banner
  const [alertNotice, setAlertNotice] = useState(null) // { type: 'success'|'error', message: string }
  const [deleteModal, setDeleteModal] = useState(null) // doc to delete

  // Defensive array wrappers
  const safeDocs = useMemo(() => (Array.isArray(documents) ? documents : []), [documents])
  const safeSubjects = useMemo(() => (Array.isArray(subjects) ? subjects : []), [subjects])

  useEffect(() => {
    fetchDocuments()
    fetchSubjects()
  }, [])

  const showAlert = (message, type = 'success') => {
    setAlertNotice({ message, type })
    setTimeout(() => setAlertNotice(null), 4000)
  }

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/documents', { timeout: 3000 })
      // DEFENSIVE CHECK: Guarantee response is a valid array
      if (Array.isArray(res.data)) {
        setDocuments(res.data)
        persistLocalDocuments(res.data)
        return
      }
    } catch (err) {
      // Backend not running (normal on Vercel static)
    }

    // Fallback to local storage documents
    const local = getLocalDocuments()
    setDocuments(local)
  }

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/subjects', { timeout: 3000 })
      if (Array.isArray(res.data)) {
        setSubjects(res.data)
        return
      }
    } catch (err) {}
  }

  const handleDownloadFromUrl = async (e) => {
    e.preventDefault()
    if (!urlForm.url) return
    setLoading(true)

    const rawUrl = urlForm.url.trim()
    let autoFilename = 'tai_lieu_tai_ve'
    try {
      const pathname = new URL(rawUrl).pathname
      const lastSegment = pathname.split('/').filter(Boolean).pop()
      if (lastSegment) autoFilename = lastSegment
    } catch (e) {}

    if (!autoFilename.includes('.')) autoFilename += '.pdf'
    const safeName = getSafeUploadFileName(autoFilename)
    const fileType = getDocumentType(safeName)
    const selectedSub = safeSubjects.find(s => String(s.id) === String(urlForm.subject_id))

    const newDoc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: urlForm.title.trim() || safeName.replace(/\.[^/.]+$/, ''),
      filename: safeName,
      file_path: rawUrl,
      file_size: 2500000, // estimated
      file_type: fileType,
      source_url: rawUrl,
      subject_id: urlForm.subject_id ? parseInt(urlForm.subject_id) : null,
      subject_name: selectedSub ? selectedSub.name : 'Tài liệu chung',
      subject_code: selectedSub ? selectedSub.code : '',
      created_at: new Date().toISOString()
    }

    // Try backend API first
    try {
      const payload = {
        title: newDoc.title,
        url: rawUrl,
        subject_id: newDoc.subject_id
      }
      const res = await axios.post('/api/documents/download-url', payload, { timeout: 5000 })
      if (res.data && res.data.id) {
        fetchDocuments()
        showAlert('Đã tải và lưu tài liệu vào hệ thống!')
        setUrlForm({ title: '', url: '', subject_id: '' })
        return
      }
    } catch (err) {
      // Backend unavailable -> Save locally with zero friction
    } finally {
      setLoading(false)
    }

    // Resilient local save
    const updated = [newDoc, ...safeDocs]
    setDocuments(updated)
    persistLocalDocuments(updated)
    setUrlForm({ title: '', url: '', subject_id: '' })
    showAlert(`Đã thêm thành công "${newDoc.title}" vào kho tài liệu!`)
  }

  const handleUploadFile = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    setLoading(true)

    const safeName = getSafeUploadFileName(uploadFile.name)
    const fileType = getDocumentType(safeName, uploadFile.type)
    const selectedSub = safeSubjects.find(s => String(s.id) === String(uploadSubjectId))
    const objUrl = URL.createObjectURL(uploadFile)

    const newDoc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: uploadTitle.trim() || safeName.replace(/\.[^/.]+$/, ''),
      filename: safeName,
      file_path: objUrl,
      file_size: uploadFile.size,
      file_type: fileType,
      source_url: '',
      subject_id: uploadSubjectId ? parseInt(uploadSubjectId) : null,
      subject_name: selectedSub ? selectedSub.name : 'Tài liệu tải lên',
      subject_code: selectedSub ? selectedSub.code : '',
      created_at: new Date().toISOString()
    }

    // Try backend upload
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', newDoc.title)
      if (uploadSubjectId) formData.append('subject_id', uploadSubjectId)

      const res = await axios.post('/api/documents/upload', formData, { timeout: 8000 })
      if (res.data && res.data.id) {
        fetchDocuments()
        showAlert('Đã tải tệp lên thư viện thành công!')
        setUploadFile(null)
        setUploadTitle('')
        setUploadSubjectId('')
        return
      }
    } catch (err) {
      // Backend not running -> Save locally
    } finally {
      setLoading(false)
    }

    const updated = [newDoc, ...safeDocs]
    setDocuments(updated)
    persistLocalDocuments(updated)
    setUploadFile(null)
    setUploadTitle('')
    setUploadSubjectId('')
    showAlert(`Đã lưu thành công tệp "${newDoc.title}" vào kho tài liệu!`)
  }

  const confirmDeleteDoc = async () => {
    if (!deleteModal) return
    const idToDelete = deleteModal.id

    try {
      await axios.delete(`/api/documents/${idToDelete}`, { timeout: 2500 })
    } catch (e) {}

    const updated = safeDocs.filter(d => d.id !== idToDelete)
    setDocuments(updated)
    persistLocalDocuments(updated)
    setDeleteModal(null)
    showAlert('Đã xóa tài liệu khỏi thư viện')
  }

  // Filtered documents (safe filter logic)
  const filteredDocs = useMemo(() => {
    return safeDocs.filter(d => {
      const titleMatch = (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      const fileMatch = (d.filename || '').toLowerCase().includes(searchTerm.toLowerCase())
      const subMatch = (d.subject_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchSearch = titleMatch || fileMatch || subMatch

      if (!matchSearch) return false
      if (typeFilter === 'ALL') return true
      return d.file_type === typeFilter
    })
  }, [safeDocs, searchTerm, typeFilter])

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Toast Notification Alert */}
      {alertNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            alertNotice.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertNotice.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{alertNotice.message}</span>
          </div>
          <button onClick={() => setAlertNotice(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Downloader Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Kho Lưu Trữ Tài Liệu & Giáo Trình Sinh Viên</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-400" />
              Công Cụ Tải & Quản Lý Tài Liệu
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Nhập link tài liệu trên mạng (PDF, Slide, Word) hoặc tải file từ máy tính để lưu trữ tập trung phục vụ học tập và thi cử.
            </p>
          </div>

          <div className="flex bg-slate-800 p-1.5 rounded-2xl text-xs font-bold gap-1 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'url' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Tải từ Link URL</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải từ Máy Tính</span>
            </button>
          </div>
        </div>

        {activeTab === 'url' ? (
          <form onSubmit={handleDownloadFromUrl} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  required
                  placeholder="Dán link tải tài liệu trực tiếp (https://.../giaotrinh.pdf, slide, zip...)"
                  value={urlForm.url}
                  onChange={e => setUrlForm({ ...urlForm, url: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Đang lưu...' : 'Lưu Vào Thư Viện'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Đặt tên gợi nhớ cho tài liệu (Tùy chọn)"
                value={urlForm.title}
                onChange={e => setUrlForm({ ...urlForm, title: e.target.value })}
                className="px-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs focus:border-blue-500 placeholder-slate-500"
              />
              <select
                value={urlForm.subject_id}
                onChange={e => setUrlForm({ ...urlForm, subject_id: e.target.value })}
                className="px-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs focus:border-blue-500"
              >
                <option value="">Gắn vào môn học (Tùy chọn)</option>
                {safeSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUploadFile} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                required
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full sm:flex-1 text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              <button
                type="submit"
                disabled={loading || !uploadFile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-blue-600/30"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Đang tải lên...' : 'Lưu Vào Thư Viện'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tên tài liệu hiển thị (Mặc định lấy theo tên file)"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs placeholder-slate-500"
              />
              <select
                value={uploadSubjectId}
                onChange={e => setUploadSubjectId(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs"
              >
                <option value="">Gắn vào môn học (Tùy chọn)</option>
                {safeSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </form>
        )}
      </div>

      {/* Document Library Section */}
      <div className="space-y-4">
        {/* Controls: Search & Category Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Kho Tài Liệu</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-xs font-mono font-bold">
              {filteredDocs.length} tệp
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Format Filter Pills */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PDF', label: 'PDF' },
                { id: 'DOCX', label: 'Word' },
                { id: 'PPTX', label: 'Slide' },
                { id: 'CODE', label: 'Code' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    typeFilter === tab.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên tài liệu, môn học..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <File className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Không tìm thấy tài liệu phù hợp.</p>
            <p className="text-xs text-slate-600 mt-1">Dán link tài liệu ở trên hoặc đổi từ khóa tìm kiếm để xem kết quả.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded uppercase font-mono text-[10px] font-bold ${
                        doc.file_type === 'PDF'
                          ? 'bg-rose-500/20 text-rose-300'
                          : doc.file_type === 'CODE'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : doc.file_type === 'DOCX'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {doc.file_type || 'FILE'}
                    </span>
                    <button
                      onClick={() => setDeleteModal(doc)}
                      title="Xóa tài liệu"
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono truncate" title={doc.filename}>
                    {doc.filename}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-medium">
                    <span>{formatBytes(doc.file_size)}</span>
                    {doc.subject_name && (
                      <span className="truncate text-slate-400">
                        • {doc.subject_name} {doc.subject_code ? `(${doc.subject_code})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <a
                    href={doc.file_path || doc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.filename}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mở / Tải Về</span>
                  </a>

                  {doc.source_url && doc.source_url.startsWith('http') && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                      title="Mở liên kết gốc trên internet"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link gốc</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa tài liệu</h3>
                <p className="text-xs text-slate-400">Hành động này sẽ xóa file khỏi thư viện</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-xs text-slate-300 font-mono break-all">
              "{deleteModal.title}"
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoc}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
