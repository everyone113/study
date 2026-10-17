import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import Peer from 'peerjs'
import confetti from 'canvas-confetti'
import {
  QrCode,
  Smartphone,
  Wifi,
  Laptop,
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  CheckCircle2,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Scissors,
  ShieldCheck,
  ZoomIn,
  X,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Globe,
  HardDrive,
  Radio,
  Check,
  Link,
  AlertTriangle
} from 'lucide-react'

// Safe file name extraction (OpenHands pattern)
export function getSafeUploadFileName(fileName) {
  if (!fileName) return `file_${Date.now()}`
  const parts = fileName.split(/[\\/]+/).filter(Boolean)
  const safeName = parts[parts.length - 1]
  if (!safeName || safeName === '.' || safeName === '..') {
    return `file_${Date.now()}`
  }
  return safeName
}

// Determine file category
export function getFileType(fileName = '', mimeType = '') {
  const ext = (fileName || '').split('.').pop().toLowerCase()
  if (['txt', 'md', 'json', 'log', 'text'].includes(ext) || (mimeType && mimeType.startsWith('text/'))) {
    return 'text'
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'].includes(ext) || (mimeType && mimeType.startsWith('image/'))) {
    return 'image'
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext) || (mimeType && mimeType.startsWith('video/'))) {
    return 'video'
  }
  if (['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(ext) || (mimeType && mimeType.startsWith('audio/'))) {
    return 'audio'
  }
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar'].includes(ext) || (mimeType && mimeType.includes('pdf'))) {
    return 'document'
  }
  return 'other'
}

// Format file size
export function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// =========================================================================
// INDEXEDDB REPOSITORY FOR ZERO-LIMIT LOCAL & RECEIVED FILE STORAGE
// =========================================================================
const DB_NAME = 'StudyMedia_WiFiDrop_DB'
const STORE_NAME = 'dropped_files'

function openDropDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not supported'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

async function saveFileToIndexedDB(item, blob) {
  try {
    const db = await openDropDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({
      id: item.id,
      filename: item.filename,
      display_name: item.display_name,
      size: item.size,
      size_formatted: item.size_formatted,
      file_type: item.file_type,
      extension: item.extension,
      created_at: item.created_at,
      text_content: item.text_content || '',
      is_link: !!item.is_link,
      blob: blob
    })
  } catch (e) {
    console.warn('IndexedDB save warning:', e)
  }
}

async function loadFilesFromIndexedDB() {
  try {
    const db = await openDropDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => {
        const list = req.result || []
        const withUrls = list.map(item => ({
          ...item,
          url: item.blob ? URL.createObjectURL(item.blob) : (item.url || ''),
          text_content: item.text_content || '',
          is_link: !!item.is_link
        }))
        withUrls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        resolve(withUrls)
      }
      req.onerror = () => resolve([])
    })
  } catch (e) {
    return []
  }
}

async function deleteFileFromIndexedDB(id) {
  try {
    const db = await openDropDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
  } catch (e) {}
}

async function clearIndexedDB() {
  try {
    const db = await openDropDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
  } catch (e) {}
}

export default function MobileConnect({ setCurrentTab }) {
  // Query params
  const urlParams = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search)
    } catch (e) {
      return new URLSearchParams()
    }
  }, [])

  const initialMode = urlParams.get('mode')
  const initialTab = urlParams.get('tab')
  const initialTargetPeer = urlParams.get('target') || ''

  const isDropModeParam = initialMode === 'drop' || initialTab === 'drop'

  const [activeTab, setActiveTab] = useState(isDropModeParam ? 'mobile_uploader' : 'hub') // 'hub' | 'mobile_uploader' | 'pwa'
  const [selectedIp, setSelectedIp] = useState('')
  const [copied, setCopied] = useState(false)

  // WebRTC / P2P State
  const [pcRoomCode, setPcRoomCode] = useState(() => {
    // Generate clean 6-character room code (e.g. "a8f2k9")
    return Math.random().toString(36).substring(2, 8).toLowerCase()
  })
  const [pcPeerId, setPcPeerId] = useState('')
  const [p2pConnectedDevices, setP2pConnectedDevices] = useState(0)
  const [phoneTargetInput, setPhoneTargetInput] = useState(initialTargetPeer)
  const [phoneConnectedToPc, setPhoneConnectedToPc] = useState(false)
  const [p2pError, setP2pError] = useState('')

  // Network Info
  const [networkInfo, setNetworkInfo] = useState(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const port = typeof window !== 'undefined' ? (window.location.port || (isHttps ? '443' : '5173')) : '5173'
    const isCloud = isHttps || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.'))

    return {
      local_ip: host,
      all_ips: [host],
      frontend_port: port,
      backend_port: 8000,
      is_cloud: isCloud
    }
  })

  // Received files in WiFi Drop (Guaranteed Array)
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [fileFilter, setFileFilter] = useState('all') // 'all' | 'image' | 'video' | 'text' | 'document'

  // Text & Note Drop States
  const [mobileMode, setMobileMode] = useState('files') // 'files' | 'text'
  const [mobileInputText, setMobileInputText] = useState('')
  const [pcInputText, setPcInputText] = useState('')
  const [copiedTextId, setCopiedTextId] = useState(null)
  const [textModalItem, setTextModalItem] = useState(null)
  const [sendingText, setSendingText] = useState(false)

  // Modals
  const [previewFile, setPreviewFile] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Mobile Uploader States
  const [selectedMobileFiles, setSelectedMobileFiles] = useState([])
  const [mobilePreviews, setMobilePreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')
  const mobileInputRef = useRef(null)

  // PC local upload box
  const [pcUploading, setPcUploading] = useState(false)
  const pcInputRef = useRef(null)

  // P2P Refs
  const peerInstanceRef = useRef(null)
  const activeConnRef = useRef(null)
  const incomingBuffersRef = useRef({})
  const broadcastChannelRef = useRef(null)

  // Safe files array (Defensive type guarantee)
  const safeFiles = useMemo(() => (Array.isArray(files) ? files : []), [files])

  // Setup BroadcastChannel for instant same-browser multi-tab sync
  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('studymedia_drop_sync')
        bc.onmessage = (e) => {
          if (e.data && e.data.type === 'NEW_FILE' && e.data.item) {
            handleReceiveCompletedFile(e.data.item, e.data.blob)
          } else if (e.data && e.data.type === 'NEW_TEXT' && e.data.item) {
            handleReceiveCompletedText(e.data.item)
          }
        }
        broadcastChannelRef.current = bc
      }
    } catch (e) {}

    return () => {
      try {
        if (broadcastChannelRef.current) broadcastChannelRef.current.close()
      } catch (e) {}
    }
  }, [])

  // Load files from IndexedDB on initial mount
  useEffect(() => {
    fetchNetworkInfo()
    loadExistingFiles()
  }, [])

  const loadExistingFiles = async () => {
    setLoadingFiles(true)
    try {
      // 1. Load from IndexedDB
      const dbFiles = await loadFilesFromIndexedDB()

      // 2. Try fetching from backend API if local server is running
      try {
        const res = await axios.get('/api/drop/files', { timeout: 2500 })
        if (Array.isArray(res.data)) {
          const dbIds = new Set(dbFiles.map(f => f.id || f.filename))
          const nonDupBackend = res.data.filter(b => !dbIds.has(b.id) && !dbIds.has(b.filename))
          setFiles([...dbFiles, ...nonDupBackend])
          return
        }
      } catch (e) {
        // Backend not running (normal on cloud/Vercel)
      }

      setFiles(dbFiles)
    } finally {
      setLoadingFiles(false)
    }
  }

  const fetchNetworkInfo = async () => {
    const host = window.location.hostname || 'localhost'
    const isHttps = window.location.protocol === 'https:'
    const port = window.location.port || (isHttps ? '443' : '5173')
    const isCloud = isHttps || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.'))

    try {
      const res = await axios.get('/api/drop/network-info', { timeout: 2500 })
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.local_ip) {
        setNetworkInfo({
          ...res.data,
          is_cloud: isCloud
        })
        if (res.data.local_ip) setSelectedIp(res.data.local_ip)
        return
      }
    } catch (err) {}

    setNetworkInfo({
      local_ip: host,
      all_ips: [host],
      frontend_port: port,
      backend_port: 8000,
      is_cloud: isCloud
    })
    setSelectedIp(host)
  }

  // =========================================================================
  // WEBRTC / PEERJS REAL-TIME ZERO-SERVER DIRECT TRANSFER
  // =========================================================================
  // =========================================================================
  // WEBRTC / PEERJS REAL-TIME ZERO-SERVER DIRECT TRANSFER
  // =========================================================================
  const handleReceiveCompletedFile = useCallback(async (item, blob) => {
    const objUrl = blob ? URL.createObjectURL(blob) : (item.url || '')
    const fullItem = {
      ...item,
      url: objUrl
    }

    // Save to IndexedDB
    if (blob) {
      await saveFileToIndexedDB(fullItem, blob)
    }

    // Prepend to files list with deduplication
    setFiles(prev => {
      const currentList = Array.isArray(prev) ? prev : []
      if (currentList.some(f => f.id === fullItem.id || (f.filename === fullItem.filename && f.size === fullItem.size))) {
        return currentList
      }
      return [fullItem, ...currentList]
    })

    // Trigger celebration confetti on PC!
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.75 }
      })
    } catch (e) {}
  }, [])

  const handleReceiveCompletedText = useCallback(async (item) => {
    const rawText = item.text_content || ''
    const isLink = item.is_link !== undefined ? item.is_link : (rawText.startsWith('http://') || rawText.startsWith('https://'))
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' })
    const objUrl = URL.createObjectURL(blob)
    const fullItem = {
      ...item,
      text_content: rawText,
      is_link: isLink,
      url: objUrl
    }

    await saveFileToIndexedDB(fullItem, blob)

    setFiles(prev => {
      const currentList = Array.isArray(prev) ? prev : []
      if (currentList.some(f => f.id === fullItem.id || (f.file_type === 'text' && f.text_content === fullItem.text_content))) {
        return currentList
      }
      return [fullItem, ...currentList]
    })

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.75 }
      })
    } catch (e) {}
  }, [])

  // Auto-sync files from backend every 3 seconds when in PC Hub mode
  useEffect(() => {
    if (activeTab !== 'hub') return

    const timer = setInterval(async () => {
      try {
        const res = await axios.get('/api/drop/files', { timeout: 2500 })
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFiles(prev => {
            const currentList = Array.isArray(prev) ? prev : []
            const currentIds = new Set(currentList.map(f => f.id || f.filename))
            const newItems = res.data.filter(b => !currentIds.has(b.id) && !currentIds.has(b.filename))
            if (newItems.length > 0) {
              try {
                confetti({
                  particleCount: 35,
                  spread: 55,
                  origin: { y: 0.75 }
                })
              } catch (e) {}
              return [...newItems, ...currentList]
            }
            return currentList
          })
        }
      } catch (e) {}
    }, 3000)

    return () => clearInterval(timer)
  }, [activeTab])

  // Initialize PC Receiver Peer
  useEffect(() => {
    if (activeTab !== 'hub') return

    let currentPeer = null
    const targetId = `study-${pcRoomCode}`

    try {
      currentPeer = new Peer(targetId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      currentPeer.on('open', (id) => {
        setPcPeerId(id)
        setP2pError('')
      })

      currentPeer.on('connection', (conn) => {
        setP2pConnectedDevices(prev => prev + 1)
        activeConnRef.current = conn

        conn.on('data', async (rawPayload) => {
          let data = rawPayload
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data)
            } catch (e) {}
          }
          if (!data || !data.type) return

          // 1. FILE START
          if (data.type === 'FILE_START') {
            incomingBuffersRef.current[data.id] = {
              metadata: data,
              chunks: [],
              receivedBytes: 0
            }
          }
          // 2. FILE CHUNK
          else if (data.type === 'FILE_CHUNK') {
            const buffer = incomingBuffersRef.current[data.id]
            if (buffer) {
              buffer.chunks.push(data.chunk)
              buffer.receivedBytes += data.chunk.byteLength || 0
            }
          }
          // 3. FILE END
          else if (data.type === 'FILE_END') {
            const buffer = incomingBuffersRef.current[data.id]
            if (buffer) {
              const meta = buffer.metadata
              const blob = new Blob(buffer.chunks, { type: meta.mimeType || 'application/octet-stream' })

              let textContent = meta.textContent || ''
              if (!textContent && (meta.fileType === 'text' || (meta.mimeType && meta.mimeType.startsWith('text/')))) {
                try {
                  textContent = await blob.text()
                } catch (e) {}
              }

              const isLink = meta.isLink !== undefined ? meta.isLink : (textContent.startsWith('http://') || textContent.startsWith('https://'))

              const item = {
                id: meta.id || `file_${Date.now()}`,
                filename: meta.name,
                display_name: meta.name,
                size: meta.size || blob.size,
                size_formatted: (meta.fileType === 'text' && textContent) ? `${textContent.length} ký tự` : formatBytes(meta.size || blob.size),
                file_type: meta.fileType || getFileType(meta.name, meta.mimeType),
                extension: (meta.name || '').split('.').pop() || '',
                text_content: textContent,
                is_link: isLink,
                created_at: new Date().toISOString()
              }

              if (item.file_type === 'text') {
                await handleReceiveCompletedText(item)
              } else {
                await handleReceiveCompletedFile(item, blob)
              }

              delete incomingBuffersRef.current[data.id]

              // Send ACK back to phone
              try { conn.send({ type: 'FILE_ACK', id: meta.id, status: 'ok' }) } catch (e) {}
            }
          }
          // 4. DROP_TEXT (Text, notes, links)
          else if (data.type === 'DROP_TEXT') {
            const rawText = data.text || ''
            const textId = data.id || `text_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
            const isLink = rawText.startsWith('http://') || rawText.startsWith('https://')
            const firstLine = rawText.split('\n')[0].trim()
            const title = data.title || firstLine.slice(0, 30) || (isLink ? 'Đường link liên kết' : 'Ghi chú văn bản')
            const item = {
              id: textId,
              filename: `${title.replace(/[\\/*?:"<>|]/g, '_')}.txt`,
              display_name: title,
              size: rawText.length,
              size_formatted: `${rawText.length} ký tự`,
              file_type: 'text',
              extension: 'txt',
              text_content: rawText,
              is_link: isLink,
              created_at: data.created_at || new Date().toISOString()
            }

            await handleReceiveCompletedText(item)
            try { conn.send({ type: 'TEXT_ACK', id: textId, status: 'ok' }) } catch (e) {}
          }
        })

        conn.on('close', () => {
          setP2pConnectedDevices(prev => Math.max(0, prev - 1))
        })
      })

      currentPeer.on('error', (err) => {
        console.warn('P2P Peer error:', err)
        if (err.type === 'unavailable-id') {
          // Regenerate new random room code if taken
          setPcRoomCode(Math.random().toString(36).substring(2, 8).toLowerCase())
        }
      })

      peerInstanceRef.current = currentPeer
    } catch (e) {
      console.warn('Cannot init PeerJS:', e)
    }

    return () => {
      try {
        if (currentPeer) currentPeer.destroy()
      } catch (e) {}
    }
  }, [activeTab, pcRoomCode, handleReceiveCompletedFile, handleReceiveCompletedText])

  // Initialize Phone Uploader Peer & Connect to PC
  const connectPhoneToPc = useCallback((targetCode) => {
    if (!targetCode) return
    const cleanCode = targetCode.trim().toLowerCase()
    const targetPeerId = cleanCode.startsWith('study-') ? cleanCode : `study-${cleanCode}`

    try {
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy()
      }

      const phonePeer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      phonePeer.on('open', () => {
        const conn = phonePeer.connect(targetPeerId, { reliable: true })

        conn.on('open', () => {
          setPhoneConnectedToPc(true)
          setP2pError('')
          activeConnRef.current = conn
        })

        conn.on('data', async (rawPayload) => {
          let data = rawPayload
          if (typeof data === 'string') {
            try { data = JSON.parse(data) } catch (e) {}
          }
          if (!data || !data.type) return

          // 1. FILE START
          if (data.type === 'FILE_START') {
            incomingBuffersRef.current[data.id] = {
              metadata: data,
              chunks: [],
              receivedBytes: 0
            }
          }
          // 2. FILE CHUNK
          else if (data.type === 'FILE_CHUNK') {
            const buffer = incomingBuffersRef.current[data.id]
            if (buffer) {
              buffer.chunks.push(data.chunk)
              buffer.receivedBytes += data.chunk.byteLength || 0
            }
          }
          // 3. FILE END
          else if (data.type === 'FILE_END') {
            const buffer = incomingBuffersRef.current[data.id]
            if (buffer) {
              const meta = buffer.metadata
              const blob = new Blob(buffer.chunks, { type: meta.mimeType || 'application/octet-stream' })

              let textContent = meta.textContent || ''
              if (!textContent && (meta.fileType === 'text' || (meta.mimeType && meta.mimeType.startsWith('text/')))) {
                try {
                  textContent = await blob.text()
                } catch (e) {}
              }

              const isLink = meta.isLink !== undefined ? meta.isLink : (textContent.startsWith('http://') || textContent.startsWith('https://'))

              const item = {
                id: meta.id || `file_${Date.now()}`,
                filename: meta.name,
                display_name: meta.name,
                size: meta.size || blob.size,
                size_formatted: (meta.fileType === 'text' && textContent) ? `${textContent.length} ký tự` : formatBytes(meta.size || blob.size),
                file_type: meta.fileType || getFileType(meta.name, meta.mimeType),
                extension: (meta.name || '').split('.').pop() || '',
                text_content: textContent,
                is_link: isLink,
                created_at: new Date().toISOString()
              }

              if (item.file_type === 'text') {
                await handleReceiveCompletedText(item)
              } else {
                await handleReceiveCompletedFile(item, blob)
              }

              delete incomingBuffersRef.current[data.id]
              try { conn.send({ type: 'FILE_ACK', id: meta.id, status: 'ok' }) } catch (e) {}
            }
          }
          // 4. DROP_TEXT
          else if (data.type === 'DROP_TEXT') {
            const rawText = data.text || ''
            const textId = data.id || `text_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
            const isLink = rawText.startsWith('http://') || rawText.startsWith('https://')
            const firstLine = rawText.split('\n')[0].trim()
            const title = data.title || firstLine.slice(0, 30) || (isLink ? 'Đường link liên kết' : 'Ghi chú văn bản')
            const item = {
              id: textId,
              filename: `${title.replace(/[\\/*?:"<>|]/g, '_')}.txt`,
              display_name: title,
              size: rawText.length,
              size_formatted: `${rawText.length} ký tự`,
              file_type: 'text',
              extension: 'txt',
              text_content: rawText,
              is_link: isLink,
              created_at: data.created_at || new Date().toISOString()
            }
            await handleReceiveCompletedText(item)
            try { conn.send({ type: 'TEXT_ACK', id: textId, status: 'ok' }) } catch (e) {}
          }
        })

        conn.on('close', () => {
          setPhoneConnectedToPc(false)
          activeConnRef.current = null
        })

        conn.on('error', (err) => {
          console.warn('P2P Conn error:', err)
          setP2pError('Không thể kết nối tới mã PC này. Vui lòng kiểm tra lại mã.')
        })
      })

      phonePeer.on('error', (err) => {
        console.warn('Phone Peer error:', err)
        setP2pError('Lỗi kết nối mạng P2P. Bạn có thể nhập mã kết nối thủ công bên dưới.')
      })

      peerInstanceRef.current = phonePeer
    } catch (e) {
      console.warn('Phone P2P init error:', e)
    }
  }, [handleReceiveCompletedText, handleReceiveCompletedFile])

  // Auto-connect phone if target query param exists
  useEffect(() => {
    if (activeTab === 'mobile_uploader' && initialTargetPeer) {
      connectPhoneToPc(initialTargetPeer)
    }
  }, [activeTab, initialTargetPeer, connectPhoneToPc])

  // Compute active IP and QR target URL
  const isCloudEnv = networkInfo.is_cloud || window.location.protocol === 'https:'
  const effectivePcCode = pcPeerId.replace('study-', '') || pcRoomCode

  // Resolve proper origin: on local machine, prefer local LAN IP over localhost so mobile phones can connect
  const localHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const isLocalHost = localHost === 'localhost' || localHost === '127.0.0.1'
  const lanIp = selectedIp || networkInfo.local_ip || localHost
  const resolvedOrigin = (!isCloudEnv && isLocalHost && lanIp && !lanIp.startsWith('127.'))
    ? `http://${lanIp}:${networkInfo.frontend_port || (typeof window !== 'undefined' ? window.location.port : '5173')}`
    : (typeof window !== 'undefined' ? window.location.origin : '')

  const qrTargetUrl = `${resolvedOrigin}/?tab=mobile&mode=drop&target=${effectivePcCode}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Copy text to clipboard helper
  const handleCopyText = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTextId(id)
      setTimeout(() => setCopiedTextId(null), 2000)
    }).catch(() => {
      window.prompt('Sao chép thủ công:', text)
    })
  }

  // Paste from clipboard helper
  const handlePasteToText = async (setter) => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText()
        if (clip) setter(clip)
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e)
    }
  }

  // Send text (bidirectional: phone -> PC or PC -> phone)
  const handleSendText = async (textToSend, customTitle = '') => {
    const rawText = (textToSend || '').trim()
    if (!rawText) return false
    setSendingText(true)

    try {
      const isLink = rawText.startsWith('http://') || rawText.startsWith('https://')
      const firstLine = rawText.split('\n')[0].trim()
      const title = customTitle || firstLine.slice(0, 30) || (isLink ? 'Đường link liên kết' : 'Ghi chú văn bản')
      const textId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      const safeFilename = `${title.replace(/[\\/*?:"<>|]/g, '_')}.txt`

      const item = {
        id: textId,
        filename: safeFilename,
        display_name: title,
        size: rawText.length,
        size_formatted: `${rawText.length} ký tự`,
        file_type: 'text',
        extension: 'txt',
        text_content: rawText,
        is_link: isLink,
        created_at: new Date().toISOString()
      }

      const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' })
      item.url = URL.createObjectURL(blob)

      // 1. Save locally to IndexedDB & UI state
      await saveFileToIndexedDB(item, blob)
      setFiles(prev => {
        const arr = Array.isArray(prev) ? prev : []
        if (arr.some(f => f.id === item.id)) return arr
        return [item, ...arr]
      })

      let deliverySuccessful = false

      // 2. WebRTC DataChannel (Direct P2P transmission)
      const conn = activeConnRef.current
      if (conn && conn.open) {
        try {
          // Strategy 1: Instant JSON DROP_TEXT message
          conn.send({
            type: 'DROP_TEXT',
            id: textId,
            title: title,
            text: rawText,
            created_at: item.created_at
          })

          // Strategy 2: Robust chunked file pipeline (identical to photos)
          conn.send({
            type: 'FILE_START',
            id: textId,
            name: safeFilename,
            size: blob.size,
            fileType: 'text',
            mimeType: 'text/plain;charset=utf-8',
            textContent: rawText,
            isLink: isLink
          })

          const textBuffer = await blob.arrayBuffer()
          const CHUNK_SIZE = 64 * 1024
          let offset = 0
          while (offset < textBuffer.byteLength) {
            const slice = textBuffer.slice(offset, offset + CHUNK_SIZE)
            conn.send({
              type: 'FILE_CHUNK',
              id: textId,
              chunk: slice
            })
            offset += CHUNK_SIZE
          }

          conn.send({
            type: 'FILE_END',
            id: textId
          })

          deliverySuccessful = true
        } catch (webrtcErr) {
          console.warn('WebRTC text send error:', webrtcErr)
        }
      }

      // 3. BroadcastChannel (for other tabs on same device)
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'NEW_TEXT',
            item: item
          })
          deliverySuccessful = true
        } catch (bcErr) {}
      }

      // 4. Background sync to local backend if online
      try {
        const res = await axios.post('/api/drop/text', { text: rawText, title: title }, { timeout: 3500 })
        if (res.data && res.data.status === 'success') {
          deliverySuccessful = true
        }
      } catch (backendErr) {
        // Local server offline or cloud mode
      }

      return deliverySuccessful || !!(conn && conn.open)
    } finally {
      setSendingText(false)
    }
  }

  // Handle files selected on mobile
  const handleMobileFileChange = (e) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length === 0) return

    setSelectedMobileFiles(chosen)
    setUploadSuccessMsg('')

    const newPreviews = chosen.map(file => {
      const safeName = getSafeUploadFileName(file.name)
      if (file.type.startsWith('image/')) {
        return { name: safeName, url: URL.createObjectURL(file), isImage: true, size: file.size }
      }
      return { name: safeName, url: null, isImage: false, size: file.size, type: file.type }
    })
    setMobilePreviews(newPreviews)
  }

  // Upload files from Mobile -> DIRECT TRANSFER TO PC
  const handleMobileUpload = async () => {
    if (selectedMobileFiles.length === 0) return
    setUploading(true)
    setUploadProgress(10)
    setUploadSuccessMsg('')

    const conn = activeConnRef.current
    const isP2pReady = conn && conn.open

    try {
      // Send each file
      for (let i = 0; i < selectedMobileFiles.length; i++) {
        const file = selectedMobileFiles[i]
        const safeName = getSafeUploadFileName(file.name)
        const fileId = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        const fileType = getFileType(safeName, file.type)

        // Path A: Direct WebRTC DataChannel Transfer to PC
        if (isP2pReady) {
          // 1. Send FILE_START
          conn.send({
            type: 'FILE_START',
            id: fileId,
            name: safeName,
            size: file.size,
            fileType: fileType,
            mimeType: file.type
          })

          // 2. Chunk file into 64KB slices
          const CHUNK_SIZE = 64 * 1024
          let offset = 0
          while (offset < file.size) {
            const slice = file.slice(offset, offset + CHUNK_SIZE)
            const chunkBuffer = await slice.arrayBuffer()
            conn.send({
              type: 'FILE_CHUNK',
              id: fileId,
              chunk: chunkBuffer
            })
            offset += CHUNK_SIZE
            const percent = Math.min(95, Math.round(((i + offset / file.size) / selectedMobileFiles.length) * 100))
            setUploadProgress(percent)
          }

          // 3. Send FILE_END
          conn.send({
            type: 'FILE_END',
            id: fileId
          })
        }

        // Path B: Sync across tabs on same device via BroadcastChannel
        if (broadcastChannelRef.current) {
          const item = {
            id: fileId,
            filename: safeName,
            display_name: safeName,
            size: file.size,
            size_formatted: formatBytes(file.size),
            file_type: fileType,
            extension: safeName.split('.').pop() || '',
            created_at: new Date().toISOString()
          }
          broadcastChannelRef.current.postMessage({
            type: 'NEW_FILE',
            item: item,
            blob: file
          })
        }

        // Path C: Try saving to local backend if running
        try {
          const fd = new FormData()
          fd.append('files', file)
          axios.post('/api/drop/upload', fd, { timeout: 3000 }).catch(() => {})
        } catch (e) {}

        // Path D: Save into Phone's IndexedDB as copy
        const phoneItem = {
          id: fileId,
          filename: safeName,
          display_name: safeName,
          size: file.size,
          size_formatted: formatBytes(file.size),
          file_type: fileType,
          extension: safeName.split('.').pop() || '',
          url: URL.createObjectURL(file),
          created_at: new Date().toISOString()
        }
        await saveFileToIndexedDB(phoneItem, file)
        setFiles(prev => [phoneItem, ...(Array.isArray(prev) ? prev : [])])
      }

      setUploadProgress(100)
      if (isP2pReady) {
        setUploadSuccessMsg(`🎉 Bắn thành công ${selectedMobileFiles.length} tệp thẳng sang màn hình máy tính!`)
      } else {
        setUploadSuccessMsg(`✅ Đã lưu ${selectedMobileFiles.length} tệp vào kho nhận! (Chưa kết nối P2P với PC)`)
      }

      setSelectedMobileFiles([])
      setMobilePreviews([])
      if (mobileInputRef.current) mobileInputRef.current.value = ''
    } catch (err) {
      console.error('Lỗi khi bắn tệp:', err)
      setUploadSuccessMsg(`Có sự cố khi truyền tệp: ${err.message || 'Lỗi không xác định'}`)
    } finally {
      setUploading(false)
    }
  }

  // Upload file from PC
  const handlePcUpload = async (e) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length === 0) return
    setPcUploading(true)

    try {
      for (const file of chosen) {
        const safeName = getSafeUploadFileName(file.name)
        const fileId = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        const item = {
          id: fileId,
          filename: safeName,
          display_name: safeName,
          size: file.size,
          size_formatted: formatBytes(file.size),
          file_type: getFileType(safeName, file.type),
          extension: safeName.split('.').pop() || '',
          url: URL.createObjectURL(file),
          created_at: new Date().toISOString()
        }
        await saveFileToIndexedDB(item, file)
        setFiles(prev => [item, ...(Array.isArray(prev) ? prev : [])])
      }

      // Also try backend upload in background
      try {
        const fd = new FormData()
        chosen.forEach(f => fd.append('files', f))
        axios.post('/api/drop/upload', fd, { timeout: 3000 }).catch(() => {})
      } catch (e) {}
    } finally {
      if (pcInputRef.current) pcInputRef.current.value = ''
      setPcUploading(false)
    }
  }

  // Delete single file
  const confirmDeleteFile = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFileFromIndexedDB(deleteTarget.id)
      try {
        await axios.delete(`/api/drop/files/${deleteTarget.filename}`, { timeout: 2000 })
      } catch (e) {}

      setFiles(prev => (Array.isArray(prev) ? prev.filter(f => f.id !== deleteTarget.id && f.filename !== deleteTarget.filename) : []))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // Clear all files
  const confirmClearAll = async () => {
    setDeleting(true)
    try {
      await clearIndexedDB()
      try {
        await axios.delete('/api/drop/clear', { timeout: 2000 })
      } catch (e) {}

      setFiles([])
      setShowClearModal(false)
    } finally {
      setDeleting(false)
    }
  }

  // Filtered files
  const filteredFiles = useMemo(() => {
    return safeFiles.filter(f => {
      if (fileFilter === 'all') return true
      return f.file_type === fileFilter
    })
  }, [safeFiles, fileFilter])

  return (
    <div className="space-y-6 pb-36 max-w-6xl mx-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="text-emerald-400 font-bold">Cổng Truyền P2P WebRTC Siêu Tốc (Trực Tiếp Điện Thoại ➔ PC)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <span>WiFi Drop & AirDrop Không Dây</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Quét mã QR bằng camera điện thoại để kết nối trực tiếp với máy tính và bắn tức thì hàng chục ảnh/video với tốc độ Wi-Fi tối đa!
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold gap-1 self-start md:self-center">
            <button
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'hub'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Mã QR & Hộp Nhận PC</span>
            </button>

            <button
              onClick={() => setActiveTab('mobile_uploader')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'mobile_uploader'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Giao Diện Điện Thoại</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'pwa'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Cài App PWA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PC HUB & QR CODE RECEIVER */}
      {/* ======================================================== */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          {/* Top Section: QR Card + Quick Setup Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* QR Card (5 columns) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Status Badge: P2P Readiness */}
              <div className="w-full max-w-sm mb-3 flex items-center justify-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                {p2pConnectedDevices > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Đã kết nối {p2pConnectedDevices} thiết bị điện thoại!</span>
                  </span>
                ) : (
                  <span className="text-blue-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                    <span>Mã phòng PC: <strong className="text-amber-300 font-mono text-sm uppercase">{effectivePcCode}</strong></span>
                  </span>
                )}
              </div>

              {/* Local Vector QR Code */}
              <div className="p-4 bg-slate-950 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 mb-3 transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
                <QRCodeSVG
                  value={qrTargetUrl}
                  size={210}
                  level="M"
                  bgColor="#020617"
                  fgColor="#38bdf8"
                  className="rounded-xl shadow-lg"
                />
              </div>

              <div className="font-extrabold text-base text-white mb-1 flex items-center gap-2">
                <span>Quét Bằng Camera Điện Thoại</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mb-3 leading-relaxed">
                Mở Camera iPhone hoặc Zalo/Google Lens quét mã QR để ghép nối trực tiếp sang máy tính này!
              </p>

              {/* Real URL box */}
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 flex items-center gap-2 text-xs font-mono mb-2">
                <span className="flex-1 truncate text-blue-300 select-all font-bold">{qrTargetUrl}</span>
                <button
                  onClick={handleCopyLink}
                  title="Sao chép link"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={qrTargetUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở thử tab mới"
                  className="p-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/20 w-full max-w-sm text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Mã Kết Nối Nhanh (Nếu không tiện quét QR):</span>
                </div>
                <div className="text-amber-300 font-mono font-black text-xl select-all tracking-widest uppercase">
                  {effectivePcCode}
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Mở điện thoại vào tab "Giao diện Điện Thoại" và nhập mã trên
                </div>
              </div>
            </div>

            {/* Quick Feature Highlights (7 columns) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Truyền Tệp P2P Không Giới Hạn Dung Lượng
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Truyền trực tiếp từ điện thoại sang máy tính qua giao thức WebRTC DataChannel mã hóa đầu-cuối. Không qua máy chủ trung gian, không bị bóp dung lượng như Zalo hay Google Drive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-2">
                    1
                  </div>
                  <h4 className="font-bold text-xs text-white">Quét Mã QR</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Camera điện thoại mở trang kết nối trực tiếp với PC.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                    2
                  </div>
                  <h4 className="font-bold text-xs text-white">Chọn Nhiều Ảnh</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Chọn hàng chục ảnh gốc, video 4K từ Album điện thoại.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                    3
                  </div>
                  <h4 className="font-bold text-xs text-white">Nhận Ngay Tại PC</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Tệp bay thẳng vào Kho Nhận ở dưới kèm pháo hoa chúc mừng!</p>
                </div>
              </div>

              {/* PC Upload Box (2-way drop) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    Thêm ảnh/video trực tiếp từ PC vào kho nhận?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bấm chọn tệp từ máy tính để lưu vào kho hoặc đưa vào Xóa phông / Lách trùng lặp 1-click.
                  </p>
                </div>

                <input
                  type="file"
                  multiple
                  ref={pcInputRef}
                  onChange={handlePcUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={pcUploading}
                  onClick={() => pcInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 flex-shrink-0 shadow-lg shadow-blue-600/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{pcUploading ? 'Đang thêm...' : 'Chọn Tệp Từ PC'}</span>
                </button>
              </div>

              {/* PC Quick Text Sender (Bắn văn bản / link tới điện thoại) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Gửi văn bản hoặc liên kết tới điện thoại</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handlePasteToText(setPcInputText)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Dán từ clipboard</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Gõ hoặc dán đoạn văn bản, ghi chú, mã code hoặc liên kết URL cần bắn sang điện thoại..."
                    value={pcInputText}
                    onChange={(e) => setPcInputText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono"
                  />
                  <button
                    type="button"
                    disabled={sendingText || !pcInputText.trim()}
                    onClick={async () => {
                      const ok = await handleSendText(pcInputText)
                      if (ok) setPcInputText('')
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send className={`w-4 h-4 ${sendingText ? 'animate-bounce' : ''}`} />
                    <span>Bắn đi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RECEIVED FILES GALLERY (HỘP NHẬN DỮ LIỆU) */}
          {/* ======================================================== */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Kho Ảnh & Tệp Đã Nhận</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      {safeFiles.length} tệp
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lưu trữ vĩnh viễn trong IndexedDB trình duyệt • Không mất dữ liệu khi tải lại</span>
                  </p>
                </div>
              </div>

              {/* Filter pills & Clean button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-medium">
                  {['all', 'image', 'video', 'text', 'document'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFileFilter(f)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        fileFilter === f ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'Tất cả' : f === 'image' ? 'Ảnh' : f === 'video' ? 'Video' : f === 'text' ? 'Văn bản' : 'Tài liệu'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => loadExistingFiles()}
                  title="Làm mới"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                </button>

                {safeFiles.length > 0 && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn sạch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Files Grid */}
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                {filteredFiles.map(file => (
                  <div
                    key={file.id || file.filename}
                    className="group bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between animate-in fade-in zoom-in-95"
                  >
                    {/* Media / Text Preview Box */}
                    <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                      {file.file_type === 'text' ? (
                        <div
                          onClick={() => setTextModalItem(file)}
                          className="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 text-left select-none cursor-pointer group-hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${file.is_link ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                              {file.is_link ? <Link className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              <span>{file.is_link ? 'Link' : 'Văn bản'}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {file.size_formatted}
                            </span>
                          </div>

                          <div className="my-auto py-1">
                            <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-4 break-words bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                              {file.text_content || file.display_name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                            <span className="text-[10px] text-slate-500">Chạm để xem</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </span>
                          </div>
                        </div>
                      ) : file.file_type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.display_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : file.file_type === 'video' ? (
                        <div className="flex flex-col items-center justify-center text-purple-400 p-2">
                          <Video className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-mono uppercase bg-purple-500/20 px-1.5 py-0.5 rounded">
                            {file.extension}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-blue-400 p-2">
                          <FileText className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-mono uppercase bg-blue-500/20 px-1.5 py-0.5 rounded">
                            {file.extension}
                          </span>
                        </div>
                      )}

                      {/* Quick Zoom Pill (for image) */}
                      {file.file_type === 'image' && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-xs"
                        >
                          <div className="p-2 rounded-xl bg-slate-900/80 text-white flex items-center gap-1.5 text-xs font-semibold">
                            <ZoomIn className="w-4 h-4" />
                            <span>Phóng to</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white truncate" title={file.display_name}>
                          {file.display_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5 font-mono">
                          <span>{file.size_formatted}</span>
                          <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {file.extension}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        {file.file_type === 'text' && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(file.text_content || file.display_name, file.id)}
                            title="Sao chép văn bản"
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                              copiedTextId === file.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {copiedTextId === file.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {file.is_link && (
                          <a
                            href={file.text_content}
                            target="_blank"
                            rel="noreferrer"
                            title="Mở liên kết"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <a
                          href={file.url}
                          download={file.display_name}
                          title="Tải về máy"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Send directly to Media Tools if image */}
                        {file.file_type === 'image' && (
                          <>
                            <button
                              onClick={() => {
                                if (setCurrentTab) setCurrentTab('media')
                              }}
                              title="Chuyển sang Xóa Phông AI"
                              className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white transition-colors"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (setCurrentTab) setCurrentTab('media')
                              }}
                              title="Chuyển sang Lách Trùng Lặp"
                              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setDeleteTarget(file)}
                          title="Xóa tệp"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 px-4 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-slate-300">Kho nhận đang trống</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hãy mở Camera điện thoại quét mã QR ở trên để bắn ảnh/video ngay lập tức sang PC!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MOBILE PHONE UPLOADER (GIAO DIỆN ĐIỆN THOẠI) */}
      {/* ======================================================== */}
      {activeTab === 'mobile_uploader' && (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Mobile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md">
                {phoneConnectedToPc ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Đã kết nối trực tiếp với Máy tính!</span>
                  </span>
                ) : (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>Chưa ghép nối với PC (Hãy nhập mã hoặc quét QR)</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white">
                Bắn Ảnh & Video Lên Máy Tính
              </h3>
              <p className="text-xs text-slate-400">
                Chạm vào nút bên dưới để chọn ảnh/video từ Thư viện điện thoại. Tệp sẽ được bắn thẳng lên màn hình PC.
              </p>
            </div>

            {/* Manual Room Code Input (If not connected or opened without QR) */}
            {!phoneConnectedToPc && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Nhập mã kết nối PC (6 ký tự):</span>
                  <span className="text-slate-500 text-[11px]">Xem mã trên màn hình PC</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ví dụ: a8f2k9"
                    value={phoneTargetInput}
                    onChange={(e) => setPhoneTargetInput(e.target.value.toLowerCase())}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-center font-bold uppercase tracking-wider focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => connectPhoneToPc(phoneTargetInput)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Ghép nối</span>
                  </button>
                </div>
                {p2pError && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{p2pError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Mode Switch: Files vs Text */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setMobileMode('files')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                  mobileMode === 'files'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Kho Ảnh & Video</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                  mobileMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Văn Bản & Link</span>
              </button>
            </div>

            {/* MODE 1: FILES & MEDIA */}
            {mobileMode === 'files' && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  ref={mobileInputRef}
                  onChange={handleMobileFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => mobileInputRef.current?.click()}
                  className="w-full py-8 px-6 rounded-3xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-white block">
                      {selectedMobileFiles.length > 0
                        ? `Đã chọn ${selectedMobileFiles.length} tệp (Chạm để chọn lại)`
                        : '📸 Chạm Để Mở Kho Ảnh / Chọn Video'}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Hỗ trợ Ảnh JPG, PNG, Live Photo, Video MP4, Tài liệu PDF
                    </span>
                  </div>
                </button>
              </>
            )}

            {/* MODE 2: TEXT & NOTES & LINKS */}
            {mobileMode === 'text' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Nội dung văn bản, ghi chú hoặc link cần bắn:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteToText(setMobileInputText)}
                    className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Dán từ Clipboard</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={mobileInputText}
                  onChange={(e) => setMobileInputText(e.target.value)}
                  placeholder="Dán hoặc nhập đoạn văn bản, ghi chú học tập, mã code, mật khẩu hoặc liên kết URL để bắn ngay lên màn hình PC..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono leading-relaxed"
                />

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>{mobileInputText.length} ký tự</span>
                  {mobileInputText && (
                    <button
                      type="button"
                      onClick={() => setMobileInputText('')}
                      className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                    >
                      Xóa trắng
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={sendingText || !mobileInputText.trim()}
                  onClick={async () => {
                    const ok = await handleSendText(mobileInputText)
                    if (ok) {
                      setMobileInputText('')
                      setUploadSuccessMsg('✅ Đã bắn văn bản sang màn hình máy tính thành công!')
                      setTimeout(() => setUploadSuccessMsg(''), 4000)
                    } else {
                      setUploadSuccessMsg('⚠️ Chưa kết nối được với PC. Vui lòng quét mã QR hoặc nhập mã kết nối.')
                      setTimeout(() => setUploadSuccessMsg(''), 5000)
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className={`w-5 h-5 ${sendingText ? 'animate-bounce' : ''}`} />
                  <span>{sendingText ? 'Đang bắn văn bản sang PC...' : '🚀 Bắn Văn Bản Lên Màn Hình PC Ngay'}</span>
                </button>
              </div>
            )}

            {/* Previews of selected photos */}
            {mobileMode === 'files' && mobilePreviews.length > 0 && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Ảnh & Video đã chọn ({mobilePreviews.length})</span>
                  <span className="text-emerald-400 font-mono">
                    Tổng: {formatBytes(selectedMobileFiles.reduce((acc, f) => acc + (f.size || 0), 0))}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {mobilePreviews.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                      {p.isImage ? (
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-purple-400 p-1 text-center font-mono">
                          VIDEO
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Big Send CTA */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleMobileUpload}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className={`w-5 h-5 ${uploading ? 'animate-bounce' : ''}`} />
                  <span>
                    {uploading
                      ? `Đang truyền siêu tốc sang PC (${uploadProgress}%)...`
                      : `🚀 Bắn ${selectedMobileFiles.length} Tệp Lên Màn Hình PC Ngay`}
                  </span>
                </button>

                {uploading && (
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {uploadSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PWA & FULL PLATFORM GUIDE */}
      {/* ======================================================== */}
      {activeTab === 'pwa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-4xl mx-auto">
          {/* Step 1: P2P Direct Connect */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              Công Nghệ WebRTC Peer-to-Peer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điện thoại và máy tính kết nối trực tiếp với nhau thông qua DataChannel mã hóa đầu-cuối. Truyền ảnh, video dung lượng lớn hàng trăm MB không qua máy chủ trung gian, tốc độ cực nhanh và bảo mật tuyệt đối.
            </p>
          </div>

          {/* Step 2: Add to Home Screen PWA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              Thêm Vào Màn Hình Chính (PWA Native App)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              - <strong>Trên iPhone (Safari)</strong>: Bấm nút <em>Chia sẻ (Share)</em> ➔ Chọn <em>Thêm vào MH chính (Add to Home Screen)</em>.<br />
              - <strong>Trên Android (Chrome)</strong>: Bấm menu 3 chấm ➔ Chọn <em>Cài đặt ứng dụng (Install App)</em>.<br />
              Ứng dụng sẽ hiển thị toàn màn hình, mượt mà y như app tải từ App Store.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IMAGE FULLSCREEN LIGHTBOX */}
      {/* ======================================================== */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{previewFile.display_name}</span>
                <span className="text-xs text-slate-400 font-mono">({previewFile.size_formatted})</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-slate-950 overflow-auto max-h-[70vh]">
              <img
                src={previewFile.url}
                alt={previewFile.display_name}
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <a
                href={previewFile.url}
                download={previewFile.display_name}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Tải Về Máy Tính</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TEXT VIEWER / COPIER LIGHTBOX */}
      {/* ======================================================== */}
      {textModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white truncate max-w-sm">{textModalItem.display_name}</span>
                <span className="text-xs text-slate-400 font-mono">({textModalItem.size_formatted})</span>
              </div>
              <button
                onClick={() => setTextModalItem(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-950/80">
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed select-all">
                {textModalItem.text_content || textModalItem.display_name}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              {textModalItem.is_link ? (
                <a
                  href={textModalItem.text_content}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở liên kết</span>
                </a>
              ) : <div></div>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(textModalItem.text_content, textModalItem.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    copiedTextId === textModalItem.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {copiedTextId === textModalItem.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTextId === textModalItem.id ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
                </button>
                <a
                  href={textModalItem.url}
                  download={textModalItem.filename || 'van_ban.txt'}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file .txt</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE SINGLE FILE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa tệp</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-xs text-slate-300 font-mono break-all">
              "{deleteTarget.display_name}"
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteFile}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CLEAR ALL CONFIRMATION */}
      {/* ======================================================== */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Dọn dẹp kho tệp</h3>
                <p className="text-xs text-slate-400">Xóa toàn bộ ảnh và tệp đã nhận</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ {safeFiles.length} tệp trong kho WiFi Drop không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmClearAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Đang dọn...' : 'Xóa tất cả'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
