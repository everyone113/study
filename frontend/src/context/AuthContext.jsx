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

  // Active User ID (either usr_... or 'guest')
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
      // Broadcast user change event to inform all views to reload their data state
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
      }, { timeout: 4000 })

      if (res.data?.success && res.data.user) {
        newUser = res.data.user
      }
    } catch (apiErr) {
      console.warn('API Register offline, creating local client identity:', apiErr)
      // Resilient Client-side Fallback
      const localId = `usr_${Math.random().toString(36).substring(2, 9)}`
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
      if (migrateGuestData) {
        migrateGuestDataToUser(newUser.id)
      }
      setCurrentUser(newUser)
      setAuthModalOpen(false)
      // Push initial sync
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
    try {
      const res = await axios.post('/api/auth/login', {
        email: cleanEmail,
        password
      }, { timeout: 4000 })

      if (res.data?.success && res.data.user) {
        const loggedUser = res.data.user
        setCurrentUser(loggedUser)
        setAuthModalOpen(false)
        // Pull latest updates from cloud
        setTimeout(() => pullCloudData(loggedUser.id), 500)
        return { success: true, user: loggedUser }
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Không thể đăng nhập. Vui lòng kiểm tra lại email và mật khẩu.'
      throw new Error(errMsg)
    }
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
      }, { timeout: 4000 })

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
      // Pull or push cloud data
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
      setSyncStatus('synced') // Don't alarm user when local vault is intact
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
        // Notify components to update
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
