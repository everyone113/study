import React, { useState, useEffect } from 'react'
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
  Search
} from 'lucide-react'

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  useEffect(() => {
    fetchDocuments()
    fetchSubjects()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/documents')
      setDocuments(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/subjects')
      setSubjects(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadFromUrl = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: urlForm.title || 'Tài liệu tải về',
        url: urlForm.url,
        subject_id: urlForm.subject_id ? parseInt(urlForm.subject_id) : null
      }
      const res = await axios.post('/api/documents/download-url', payload)
      setUrlForm({ title: '', url: '', subject_id: '' })
      fetchDocuments()
      alert('Tải tài liệu thành công!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi tải tài liệu từ liên kết này')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFile = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle || uploadFile.name)
      if (uploadSubjectId) formData.append('subject_id', uploadSubjectId)

      await axios.post('/api/documents/upload', formData)
      setUploadFile(null)
      setUploadTitle('')
      setUploadSubjectId('')
      fetchDocuments()
      alert('Tải lên thành công!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi tải file')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDoc = async (id) => {
    if (confirm('Xóa tài liệu này khỏi hệ thống?')) {
      await axios.delete(`/api/documents/${id}`)
      fetchDocuments()
    }
  }

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Downloader Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-400" />
              Công Cụ Tải Tài Liệu Từ Mạng
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Nhập link PDF, slide giáo trình, file tài liệu trên internet để hệ thống tự động tải và lưu trữ vào ổ D
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'url' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Tải từ Link URL
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Tải từ Máy tính
            </button>
          </div>
        </div>

        {activeTab === 'url' ? (
          <form onSubmit={handleDownloadFromUrl} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  required
                  placeholder="Dán link tải tài liệu trực tiếp (PDF, Word, Slide, Zip...)"
                  value={urlForm.url}
                  onChange={e => setUrlForm({ ...urlForm, url: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Đang tải về...' : 'Tải Về Máy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Đặt tên tài liệu (Tùy chọn)"
                value={urlForm.title}
                onChange={e => setUrlForm({ ...urlForm, title: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs focus:border-blue-500"
              />
              <select
                value={urlForm.subject_id}
                onChange={e => setUrlForm({ ...urlForm, subject_id: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs focus:border-blue-500"
              >
                <option value="">Gắn vào môn học (Tùy chọn)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUploadFile} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                required
                onChange={e => setUploadFile(e.target.files[0])}
                className="w-full sm:flex-1 text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !uploadFile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Đang tải lên...' : 'Lưu File'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tên tài liệu hiển thị"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs"
              />
              <select
                value={uploadSubjectId}
                onChange={e => setUploadSubjectId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/80 text-white text-xs"
              >
                <option value="">Gắn vào môn học (Tùy chọn)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </form>
        )}
      </div>

      {/* Document Library List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Tài Liệu Đã Lưu ({filteredDocs.length})
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <File className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">Chưa có tài liệu nào trong thư viện.</p>
            <p className="text-xs text-slate-600 mt-1">Dán link tài liệu ở trên để tải file về máy</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded uppercase font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {doc.file_type || 'FILE'}
                    </span>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">{doc.title}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">{doc.filename}</p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
                    <span>{formatSize(doc.file_size)}</span>
                    {doc.subject_name && <span>• {doc.subject_name}</span>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <a
                    href={doc.file_path}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mở / Tải File</span>
                  </a>

                  {doc.source_url && doc.source_url.startsWith('http') && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1"
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
    </div>
  )
}
