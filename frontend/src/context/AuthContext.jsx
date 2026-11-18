import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '../services/authService.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'skillstack_token'
const USER_KEY = 'skillstack_user'

const readStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const persistUser = useCallback((nextUser) => {
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
    setUser(nextUser)
  }, [])

  const login = useCallback((auth) => {
    const safeUser = auth.user ? {
      id: auth.user.id || auth.user._id,
      username: auth.user.username,
      email: auth.user.email,
      role: auth.user.role,
      accountStatus: auth.user.accountStatus,
      tutorApprovalStatus: auth.user.tutorApprovalStatus,
      tutorRejectionReason: auth.user.tutorRejectionReason,
      profileImage: auth.user.profileImage,
    } : null
    localStorage.setItem(TOKEN_KEY, auth.token)
    setToken(auth.token)
    persistUser(safeUser)
  }, [persistUser])

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    const currentUser = await getCurrentUser()
    const safeUser = {
      id: currentUser.id || currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role,
      accountStatus: currentUser.accountStatus,
      tutorApprovalStatus: currentUser.tutorApprovalStatus,
      tutorRejectionReason: currentUser.tutorRejectionReason,
      profileImage: currentUser.profileImage,
    }
    persistUser(safeUser)
    return safeUser
  }, [persistUser])

  useEffect(() => {
    window.addEventListener('skillstack:session-expired', logout)
    return () => window.removeEventListener('skillstack:session-expired', logout)
  }, [logout])

  useEffect(() => {
    if (token) refreshUser().catch(() => {})
  }, [token, refreshUser])

  const value = useMemo(() => ({
    token, user, isAuthenticated: Boolean(token), isAdmin: user?.role === 'admin', isTutor: user?.role === 'tutor', login, logout, refreshUser,
  }), [token, user, login, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
