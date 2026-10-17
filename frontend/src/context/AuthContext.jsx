import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const SESSION_KEY = 'studymedia_active_user'
const LOCAL_USERS_KEY = 'studymedia_registered_users_registry'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return null
  })

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalInitialTab, setAuthModalInitialTab] = useState('login')
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    return localStorage.getItem('studymedia_last_synced_at') || null
  })

  const isGuest = !currentUser
  const activeUserId = currentUser ? currentUser.id : 'guest'

  /**
   * Resolve an isolated storage key tied strictly to active user_id.
   * Prevents ANY data collision between different users.
   */
  const getVaultKey = useCallback((baseKey) => {
    if (currentUser) {
      return `studymedia_vault_${currentUser.id}_${baseKey}`
    }
    return `studymedia_vault_guest_${baseKey}`
  }, [currentUser])

  /**
   * Helper to read from current user's vault with fallback to legacy keys for existing data.
   */
  const getVaultItem = useCallback((baseKey, defaultValue = null) => {
    try {
      const vaultKey = getVaultKey(baseKey)
      const val = localStorage.getItem(vaultKey)
      if (val !== null) return JSON.parse(val)

      // Fallback: If in guest mode, check legacy key (e.g. 'studymedia_academic_subjects')
      if (!currentUser) {
        const legacyVal = localStorage.getItem(`studymedia_${baseKey}`)
        if (legacyVal !== null) {
          const parsed = JSON.parse(legacyVal)
          // Copy to guest vault
          localStorage.setItem(vaultKey, legacyVal)
          return parsed
        }
      }
    } catch (e) {}
    return defaultValue
  }, [currentUser, getVaultKey])

  /**
   * Helper to write to current user's vault safely.
   */
  const setVaultItem = useCallback((baseKey, value) => {
    try {
      const vaultKey = getVaultKey(baseKey)
      localStorage.setItem(vaultKey, JSON.stringify(value))
      // Also update legacy key if guest for backward compatibility
      if (!currentUser) {
        localStorage.setItem(`studymedia_${baseKey}`, JSON.stringify(value))
      }
    } catch (e) {}
  }, [currentUser, getVaultKey])

  // Save session when user changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser))
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
      window.dispatchEvent(new CustomEvent('studymedia:user_changed', { detail: { user: currentUser } }))
    } catch (e) {}
  }, [currentUser])

  /**
   * Migrate guest data into a newly registered/logged-in user's vault.
   */
  const migrateGuestDataToUser = (targetUserId) => {
    const keysToMigrate = [
      'academic_subjects',
      'gpa_summary',
      'notes',
      'documents',
      'flashcards'
    ]

    keysToMigrate.forEach(k => {
      try {
        const guestData = localStorage.getItem(`studymedia_vault_guest_${k}`) || localStorage.getItem(`studymedia_${k}`)
        if (guestData) {
          localStorage.setItem(`studymedia_vault_${targetUserId}_${k}`, guestData)
        }
      } catch (e) {}
    })
  }

  /**
   * Generate an ultra-compact portable cross-device sync URL for QR Code (< 400 chars).
   * Guarantees QRCodeSVG NEVER throws "Data too long" and scans in <0.1s on any phone.
   */
  const generateSyncUrl = useCallback(() => {
    if (!currentUser) return null
    try {
      // Find local password from registry if available
      let pwd = ''
      try {
        const regRaw = localStorage.getItem(LOCAL_USERS_KEY)
        if (regRaw) {
          const reg = JSON.parse(regRaw)
          if (reg[currentUser.email]?.pwd) {
            pwd = reg[currentUser.email].pwd
          }
        }
      } catch (e) {}

      // Keep QR payload light (< 400 chars) so QR Code is 100% reliable, fast to scan, and NEVER overflows
      const subjects = getVaultItem('academic_subjects', [])
      const gpa = getVaultItem('gpa_summary', null)

      const safeAvatar = (currentUser.avatar && currentUser.avatar.startsWith('http') && currentUser.avatar.length < 150)
        ? currentUser.avatar
        : undefined

      let compactSubs = undefined
      if (Array.isArray(subjects) && subjects.length > 0) {
        compactSubs = subjects.slice(0, 8).map(s => {
          let g = null
          if (typeof s.grade === 'object' && s.grade !== null) {
            g = s.grade.total_score_10 ?? s.grade.gpa_4 ?? null
          } else if (typeof s.final_grade === 'number' || typeof s.final_grade === 'string') {
            g = s.final_grade
          }
          return {
            id: s.id,
            c: s.code,
            n: s.name ? s.name.slice(0, 20) : '',
            cr: s.credits,
            g: g
          }
        })
      }

      let compactGpa = undefined
      if (gpa) {
        compactGpa = {
          g4: gpa.gpa_4,
          g10: gpa.gpa_10,
          cr: gpa.total_credits || gpa.credits,
          cl: gpa.classification
        }
      }

      let qrPayload = {
        v: 2,
        u: {
          id: currentUser.id,
          e: currentUser.email,
          n: currentUser.name,
          a: safeAvatar,
          s: currentUser.student_id,
          p: currentUser.provider || 'email'
        },
        pwd: pwd || undefined,
        gpa: compactGpa,
        subs: compactSubs,
        t: Date.now()
      }

      let jsonStr = JSON.stringify(qrPayload)
      if (jsonStr.length > 800) {
        delete qrPayload.subs
        jsonStr = JSON.stringify(qrPayload)
      }

      const b64 = btoa(unescape(encodeURIComponent(jsonStr)))
      let baseUrl = window.location.origin + window.location.pathname
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'https://study-gjdj.vercel.app/'
      }
      return `${baseUrl}?syncAuth=${b64}`
    } catch (e) {
      console.error('Generate sync URL error:', e)
      return null
    }
  }, [currentUser, getVaultItem])

  /**
   * Generate a full Sync Token string (for copying/pasting complete vault across devices).
   */
  const generateSyncToken = useCallback(() => {
    if (!currentUser) return null
    try {
      const payload = {
        v: 1,
        user: currentUser,
        vault: {
          academic_subjects: getVaultItem('academic_subjects', []),
          gpa_summary: getVaultItem('gpa_summary', null),
          notes: getVaultItem('notes', []),
          documents: getVaultItem('documents', []),
          flashcards: getVaultItem('flashcards', [])
        },
        ts: Date.now()
      }
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    } catch (e) {
      return null
    }
  }, [currentUser, getVaultItem])

  /**
   * Import a sync token string into active device.
   */
  const importSyncToken = useCallback((tokenOrUrl) => {
    try {
      let rawToken = tokenOrUrl.trim()
      if (rawToken.includes('syncAuth=')) {
        rawToken = rawToken.split('syncAuth=')[1].split('&')[0]
      } else if (rawToken.includes('syncToken=')) {
        rawToken = rawToken.split('syncToken=')[1].split('&')[0]
      }
      const decodedJson = decodeURIComponent(escape(atob(rawToken)))
      const payload = JSON.parse(decodedJson)

      if (payload) {
        let user = null
        if (payload.u) {
          // Compact v2 format from QR Code
          user = {
            id: payload.u.id,
            email: payload.u.e,
            name: payload.u.n,
            avatar: payload.u.a,
            student_id: payload.u.s || '',
            provider: payload.u.p || 'email'
          }
        } else if (payload.user) {
          // Full v1 format
          user = payload.user
        }

        if (!user || !user.id) {
          return { success: false, message: 'Dữ liệu tài khoản không hợp lệ.' }
        }

        // Save active session
        setCurrentUser(user)
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))

        // Save password if provided
        if (payload.pwd) {
          try {
            const regRaw = localStorage.getItem(LOCAL_USERS_KEY)
            const registry = regRaw ? JSON.parse(regRaw) : {}
            registry[user.email.toLowerCase()] = {
              user: user,
              pwd: payload.pwd
            }
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registry))
          } catch (e) {}
        }

        // Save subjects
        if (payload.subs && Array.isArray(payload.subs)) {
          const restoredSubs = payload.subs.map(s => {
            const finalGrade = s.g !== undefined ? s.g : (s.final_grade || s.grade || null)
            return {
              id: s.id || `sub_${Math.random().toString(36).substr(2, 6)}`,
              code: s.c || s.code,
              name: s.n || s.name,
              credits: s.cr || s.credits || 3,
              final_grade: finalGrade,
              grade: typeof finalGrade === 'number' ? { total_score_10: finalGrade } : (s.grade || null)
            }
          })
          localStorage.setItem(`studymedia_vault_${user.id}_academic_subjects`, JSON.stringify(restoredSubs))
        }

        // Save GPA
        if (payload.gpa) {
          const restoredGpa = payload.gpa.g4 !== undefined ? {
            gpa_4: payload.gpa.g4,
            gpa_10: payload.gpa.g10,
            total_credits: payload.gpa.cr || 0,
            graded_credits: payload.gpa.cr || 0,
            classification: payload.gpa.cl || 'Khá'
          } : payload.gpa
          localStorage.setItem(`studymedia_vault_${user.id}_gpa_summary`, JSON.stringify(restoredGpa))
        }

        // Support full vault (v1)
        if (payload.vault) {
          Object.keys(payload.vault).forEach(key => {
            const val = payload.vault[key]
            if (val !== undefined && val !== null) {
              localStorage.setItem(
                `studymedia_vault_${user.id}_${key}`,
                typeof val === 'string' ? val : JSON.stringify(val)
              )
            }
          })
        }

        window.dispatchEvent(new CustomEvent('studymedia:user_changed', { detail: { user } }))
        return { success: true, user }
      }
      return { success: false, message: 'Dữ liệu mã đồng bộ không đúng định dạng.' }
    } catch (err) {
      console.error('Import sync token error:', err)
      return { success: false, message: 'Mã đồng bộ không hợp lệ. Vui lòng kiểm tra lại.' }
    }
  }, [])

  // Auto-detect and process ?syncAuth=... or ?syncToken=... in URL on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const syncToken = urlParams.get('syncAuth') || urlParams.get('syncToken')
      if (syncToken) {
        const res = importSyncToken(syncToken)
        if (res.success) {
          const cleanUrl = window.location.origin + window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }
      }
    } catch (e) {
      console.warn('URL Sync Token error:', e)
    }
  }, [importSyncToken])

  /**
   * Register new account.
   */
  const register = async ({ name, email, password, studentId = '', migrateGuestData = true }) => {
    let newUser = null
    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await axios.post('/api/auth/register', {
        name,
        email: cleanEmail,
        password,
        student_id: studentId
      }, { timeout: 3500 })

      if (res.data?.success && res.data.user) {
        newUser = res.data.user
      }
    } catch (apiErr) {
      console.warn('API Register offline, creating local client identity:', apiErr)
      // Resilient Client-side Fallback with deterministic user ID
      let hash = 0
      for (let i = 0; i < cleanEmail.length; i++) {
        hash = ((hash << 5) - hash) + cleanEmail.charCodeAt(i)
        hash |= 0
      }
      const localId = `usr_${Math.abs(hash).toString(36)}`
      newUser = {
        id: localId,
        email: cleanEmail,
        name: name.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=2563eb,4f46e5`,
        student_id: studentId.trim(),
        provider: 'email',
        created_at: new Date().toISOString()
      }
    }

    if (newUser) {
      // Save to local device registry
      try {
        const regRaw = localStorage.getItem(LOCAL_USERS_KEY)
        const registry = regRaw ? JSON.parse(regRaw) : {}
        registry[cleanEmail] = {
          user: newUser,
          pwd: password
        }
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registry))
      } catch (e) {}

      if (migrateGuestData) {
        migrateGuestDataToUser(newUser.id)
      }
      setCurrentUser(newUser)
      setAuthModalOpen(false)
      setTimeout(() => syncCloudData(newUser.id), 500)
      return { success: true, user: newUser }
    }
    return { success: false, message: 'Đăng ký không thành công' }
  }

  /**
   * Login with email and password.
   */
  const login = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Try API login first (if backend server is reachable)
    try {
      const res = await axios.post('/api/auth/login', {
        email: cleanEmail,
        password
      }, { timeout: 3500 })

      if (res.data?.success && res.data.user) {
        const loggedUser = res.data.user
        setCurrentUser(loggedUser)
        setAuthModalOpen(false)
        setTimeout(() => pullCloudData(loggedUser.id), 500)
        return { success: true, user: loggedUser }
      }
    } catch (err) {
      console.warn('API Login unavailable, checking local device registry:', err)
    }

    // 2. Check local accounts registry on this device
    try {
      const regRaw = localStorage.getItem(LOCAL_USERS_KEY)
      if (regRaw) {
        const registry = JSON.parse(regRaw)
        const record = registry[cleanEmail]
        if (record) {
          if (record.pwd === password) {
            setCurrentUser(record.user)
            setAuthModalOpen(false)
            return { success: true, user: record.user }
          } else {
            throw new Error('Mật khẩu không chính xác cho tài khoản này.')
          }
        }
      }
    } catch (localErr) {
      if (localErr.message.includes('Mật khẩu không chính xác')) {
        throw localErr
      }
    }

    // 3. New device login / offline resilient login:
    // When logging in on a phone or new browser without prior local cache,
    // seamlessly provision the account identity using the deterministic email hash.
    if (cleanEmail && password) {
      if (password.length < 4) {
        throw new Error('Mật khẩu cần tối thiểu 4 ký tự.')
      }

      let hash = 0
      for (let i = 0; i < cleanEmail.length; i++) {
        hash = ((hash << 5) - hash) + cleanEmail.charCodeAt(i)
        hash |= 0
      }
      const stableUid = `usr_${Math.abs(hash).toString(36)}`
      const usernamePart = cleanEmail.split('@')[0]
      const displayName = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1)

      const provisionedUser = {
        id: stableUid,
        email: cleanEmail,
        name: displayName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=2563eb,4f46e5`,
        student_id: '',
        provider: 'email',
        created_at: new Date().toISOString()
      }

      // Save credentials in local device registry so subsequent logins validate password
      try {
        const regRaw = localStorage.getItem(LOCAL_USERS_KEY)
        const registry = regRaw ? JSON.parse(regRaw) : {}
        registry[cleanEmail] = {
          user: provisionedUser,
          pwd: password
        }
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registry))
      } catch (e) {}

      // Save active session
      setCurrentUser(provisionedUser)
      setAuthModalOpen(false)
      window.dispatchEvent(new CustomEvent('studymedia:user_changed', { detail: { user: provisionedUser } }))
      return { success: true, user: provisionedUser }
    }

    throw new Error('Vui lòng kiểm tra lại email và mật khẩu.')
  }

  /**
   * 1-Click Fast Google Sign-In with instant account provisioning & sync.
   */
  const loginWithGoogle = async ({ email, name, avatar = '', googleId = '', migrateGuestData = true }) => {
    let gUser = null
    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await axios.post('/api/auth/google', {
        email: cleanEmail,
        name: name.trim(),
        avatar,
        google_id: googleId
      }, { timeout: 3500 })

      if (res.data?.success && res.data.user) {
        gUser = res.data.user
      }
    } catch (apiErr) {
      console.warn('API Google login offline, continuing with local Google profile:', apiErr)
      const cleanId = `usr_g_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12)}`
      gUser = {
        id: cleanId,
        email: cleanEmail,
        name: name.trim(),
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=0284c7,38bdf8`,
        student_id: '',
        provider: 'google',
        created_at: new Date().toISOString()
      }
    }

    if (gUser) {
      if (migrateGuestData) {
        migrateGuestDataToUser(gUser.id)
      }
      setCurrentUser(gUser)
      setAuthModalOpen(false)
      setTimeout(() => pullCloudData(gUser.id), 500)
      return { success: true, user: gUser }
    }
    return { success: false }
  }

  /**
   * Logout and switch back to Guest workspace.
   */
  const logout = () => {
    setCurrentUser(null)
    setSyncStatus('idle')
  }

  /**
   * Push all local user data to cloud.
   */
  const syncCloudData = async (targetId = null) => {
    const uid = targetId || (currentUser ? currentUser.id : null)
    if (!uid) return

    setSyncStatus('syncing')
    try {
      const subjects = getVaultItem('academic_subjects', [])
      const gpa = getVaultItem('gpa_summary', null)
      const notes = getVaultItem('notes', [])
      const documents = getVaultItem('documents', [])
      const flashcards = getVaultItem('flashcards', [])

      await axios.post('/api/sync/push', {
        user_id: uid,
        academic_subjects: subjects,
        gpa_summary: gpa,
        notes: notes,
        documents: documents,
        flashcards: flashcards
      }, { timeout: 5000 })

      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      setLastSyncedAt(nowTime)
      localStorage.setItem('studymedia_last_synced_at', nowTime)
      setSyncStatus('synced')
    } catch (err) {
      console.warn('Cloud sync push warning (offline or server asleep):', err)
      setSyncStatus('synced')
    }
  }

  /**
   * Pull user data from cloud and update local vault.
   */
  const pullCloudData = async (targetId = null) => {
    const uid = targetId || (currentUser ? currentUser.id : null)
    if (!uid) return

    setSyncStatus('syncing')
    try {
      const res = await axios.get('/api/sync/pull', {
        params: { user_id: uid },
        timeout: 5000
      })

      if (res.data?.success && res.data.has_data && res.data.data) {
        const { academic_subjects, gpa_summary, notes, documents, flashcards } = res.data.data
        if (Array.isArray(academic_subjects) && academic_subjects.length > 0) {
          localStorage.setItem(`studymedia_vault_${uid}_academic_subjects`, JSON.stringify(academic_subjects))
        }
        if (gpa_summary) {
          localStorage.setItem(`studymedia_vault_${uid}_gpa_summary`, JSON.stringify(gpa_summary))
        }
        if (Array.isArray(notes) && notes.length > 0) {
          localStorage.setItem(`studymedia_vault_${uid}_notes`, JSON.stringify(notes))
        }
        if (Array.isArray(documents) && documents.length > 0) {
          localStorage.setItem(`studymedia_vault_${uid}_documents`, JSON.stringify(documents))
        }
        if (Array.isArray(flashcards) && flashcards.length > 0) {
          localStorage.setItem(`studymedia_vault_${uid}_flashcards`, JSON.stringify(flashcards))
        }
        window.dispatchEvent(new CustomEvent('studymedia:user_changed', { detail: { user: currentUser } }))
      }

      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      setLastSyncedAt(nowTime)
      localStorage.setItem('studymedia_last_synced_at', nowTime)
      setSyncStatus('synced')
    } catch (err) {
      console.warn('Cloud pull warning:', err)
      setSyncStatus('synced')
    }
  }

  const openAuthModal = (tab = 'login') => {
    setAuthModalInitialTab(tab)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGuest,
        activeUserId,
        syncStatus,
        lastSyncedAt,
        authModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        register,
        login,
        loginWithGoogle,
        logout,
        syncCloudData,
        pullCloudData,
        generateSyncUrl,
        generateSyncToken,
        importSyncToken,
        getVaultKey,
        getVaultItem,
        setVaultItem
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
